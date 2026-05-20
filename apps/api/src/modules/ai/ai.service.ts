import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AiProvider, AiProviderType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { encryptSecret, decryptSecret, maskSecret } from '../../common/utils/crypto.util';
import { getAdapter } from './providers/factory';
import { AiAdapterError, AiCompletionRequest, AiCompletionResponse } from './providers/base.adapter';
import { CreateAiProviderDto, UpdateAiProviderDto } from './dto/ai-provider.dto';

export interface AiProviderView {
  id: string;
  type: AiProviderType;
  label: string;
  apiKeyMasked: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  isDefault: boolean;
  rateLimitRpm: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RateBucket { count: number; resetAt: number; }

@Injectable()
export class AiService {
  private rateLimits = new Map<string, RateBucket>();

  constructor(private prisma: PrismaService) {}

  private toView(p: AiProvider): AiProviderView {
    let masked = '••••••••';
    try { masked = maskSecret(decryptSecret(p.apiKeyEnc)); } catch {}
    return {
      id: p.id,
      type: p.type,
      label: p.label,
      apiKeyMasked: masked,
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      enabled: p.enabled,
      isDefault: p.isDefault,
      rateLimitRpm: p.rateLimitRpm,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async list(userId: string): Promise<AiProviderView[]> {
    const rows = await this.prisma.aiProvider.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => this.toView(r));
  }

  async create(userId: string, dto: CreateAiProviderDto): Promise<AiProviderView> {
    const apiKeyEnc = encryptSecret(dto.apiKey);
    const shouldBeDefault = dto.isDefault ?? (await this.prisma.aiProvider.count({ where: { userId } })) === 0;

    const created = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.aiProvider.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.aiProvider.create({
        data: {
          userId,
          type: dto.type,
          label: dto.label,
          apiKeyEnc,
          model: dto.model,
          temperature: dto.temperature ?? 0.3,
          maxTokens: dto.maxTokens ?? 1024,
          enabled: dto.enabled ?? true,
          isDefault: shouldBeDefault,
          rateLimitRpm: dto.rateLimitRpm ?? 60,
        },
      });
    });
    return this.toView(created);
  }

  async update(userId: string, id: string, dto: UpdateAiProviderDto): Promise<AiProviderView> {
    const existing = await this.prisma.aiProvider.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('AI provider not found');

    const data: Prisma.AiProviderUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.temperature !== undefined) data.temperature = dto.temperature;
    if (dto.maxTokens !== undefined) data.maxTokens = dto.maxTokens;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.rateLimitRpm !== undefined) data.rateLimitRpm = dto.rateLimitRpm;
    if (dto.apiKey !== undefined) data.apiKeyEnc = encryptSecret(dto.apiKey);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.aiProvider.updateMany({ where: { userId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
        data.isDefault = true;
      } else if (dto.isDefault === false) {
        data.isDefault = false;
      }
      return tx.aiProvider.update({ where: { id }, data });
    });
    return this.toView(updated);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.aiProvider.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('AI provider not found');
    await this.prisma.aiProvider.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await this.prisma.aiProvider.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (next) await this.prisma.aiProvider.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { deleted: true };
  }

  async setDefault(userId: string, id: string): Promise<AiProviderView> {
    return this.update(userId, id, { isDefault: true });
  }

  async test(userId: string, id: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const provider = await this.prisma.aiProvider.findFirst({ where: { id, userId } });
    if (!provider) throw new NotFoundException('AI provider not found');
    const apiKey = decryptSecret(provider.apiKeyEnc);
    const adapter = getAdapter(provider.type);
    const start = Date.now();
    try {
      await adapter.ping(apiKey, provider.model);
      return { ok: true, latencyMs: Date.now() - start };
    } catch (e: any) {
      return { ok: false, latencyMs: Date.now() - start, error: e?.message ?? String(e) };
    }
  }

  private checkRateLimit(provider: AiProvider): void {
    const now = Date.now();
    const key = provider.id;
    const bucket = this.rateLimits.get(key);
    if (!bucket || bucket.resetAt < now) {
      this.rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
      return;
    }
    if (bucket.count >= provider.rateLimitRpm) {
      throw new ServiceUnavailableException(`Rate limit exceeded for provider ${provider.label} (${provider.rateLimitRpm}/min)`);
    }
    bucket.count++;
  }

  async getDefaultProvider(userId: string): Promise<AiProvider> {
    const def = await this.prisma.aiProvider.findFirst({ where: { userId, enabled: true, isDefault: true } });
    if (def) return def;
    const first = await this.prisma.aiProvider.findFirst({ where: { userId, enabled: true }, orderBy: { createdAt: 'asc' } });
    if (!first) throw new BadRequestException('No enabled AI provider configured. Add one in Settings > AI & Integrations.');
    return first;
  }

  async run(userId: string, task: string, req: Omit<AiCompletionRequest, 'model'> & { providerId?: string; modelOverride?: string }): Promise<AiCompletionResponse> {
    const provider = req.providerId
      ? await this.prisma.aiProvider.findFirst({ where: { id: req.providerId, userId, enabled: true } })
      : await this.getDefaultProvider(userId);
    if (!provider) throw new NotFoundException('AI provider not available');

    this.checkRateLimit(provider);
    const adapter = getAdapter(provider.type);
    const apiKey = decryptSecret(provider.apiKeyEnc);
    const start = Date.now();
    try {
      const result = await adapter.complete(
        {
          system: req.system,
          prompt: req.prompt,
          model: req.modelOverride ?? provider.model,
          temperature: req.temperature ?? provider.temperature,
          maxTokens: req.maxTokens ?? provider.maxTokens,
          signal: req.signal,
        },
        apiKey,
      );
      await this.prisma.aiUsageLog.create({
        data: {
          providerId: provider.id,
          userId,
          task,
          promptTokens: result.promptTokens,
          outputTokens: result.outputTokens,
          latencyMs: Date.now() - start,
          success: true,
        },
      });
      return result;
    } catch (e: any) {
      const message = e instanceof AiAdapterError ? e.message : (e?.message ?? String(e));
      await this.prisma.aiUsageLog.create({
        data: {
          providerId: provider.id,
          userId,
          task,
          latencyMs: Date.now() - start,
          success: false,
          errorMessage: message.slice(0, 500),
        },
      });
      throw new ServiceUnavailableException(message);
    }
  }
}
