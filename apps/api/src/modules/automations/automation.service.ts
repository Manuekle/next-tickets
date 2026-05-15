import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AutomationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; isActive?: boolean; trigger?: string }) {
    const { page = 1, limit = 20, isActive, trigger } = query;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (trigger) where.trigger = trigger;

    const [data, total] = await Promise.all([
      this.prisma.automation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.automation.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const rule = await this.prisma.automation.findUnique({ where: { id } });
    if (!rule) throw new Error('Automation rule not found');
    return rule;
  }

  async create(dto: any) {
    return this.prisma.automation.create({
      data: {
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger,
        conditions: dto.conditions ?? [],
        actions: dto.actions,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.trigger !== undefined) data.trigger = dto.trigger;
    if (dto.conditions !== undefined) data.conditions = dto.conditions;
    if (dto.actions !== undefined) data.actions = dto.actions;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.automation.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.automation.delete({ where: { id } });
  }

  async evaluateTrigger(trigger: string, context: { ticket?: any; user?: any; changes?: any }) {
    const rules = await this.prisma.automation.findMany({
      where: { trigger, isActive: true },
    });

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions as any[], context)) {
        await this.executeActions(rule.actions as any[], context);
      }
    }
  }

  private evaluateConditions(conditions: any[], context: { ticket?: any }): boolean {
    if (!conditions?.length) return true;

    return conditions.every((condition) => {
      const ticketValue = this.getNestedValue(context.ticket, condition.field);
      switch (condition.operator) {
        case 'equals': return ticketValue === condition.value;
        case 'not_equals': return ticketValue !== condition.value;
        case 'contains': return String(ticketValue ?? '').includes(condition.value);
        case 'greater_than': return Number(ticketValue) > Number(condition.value);
        case 'less_than': return Number(ticketValue) < Number(condition.value);
        default: return false;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeActions(actions: any[], context: { ticket?: any; user?: any }) {
    for (const action of actions) {
      switch (action.type) {
        case 'assign_user':
          await this.prisma.ticket.update({
            where: { id: context.ticket.id },
            data: { assignedToId: action.params.userId },
          });
          break;

        case 'assign_team': {
          const agent = await this.prisma.user.findFirst({
            where: { role: 'AGENT', isActive: true },
            orderBy: { createdAt: 'asc' },
          });
          if (agent) {
            await this.prisma.ticket.update({
              where: { id: context.ticket.id },
              data: { assignedToId: agent.id },
            });
          }
          break;
        }

        case 'set_priority':
          await this.prisma.ticket.update({
            where: { id: context.ticket.id },
            data: { priority: action.params.priority },
          });
          break;

        case 'set_status':
          await this.prisma.ticket.update({
            where: { id: context.ticket.id },
            data: { status: action.params.status },
          });
          break;

        case 'add_tags': {
          const tag = await this.prisma.tag.findFirst({
            where: { name: action.params.tagName },
          });
          if (tag) {
            await this.prisma.ticketTag.create({
              data: { ticketId: context.ticket.id, tagId: tag.id },
            });
          }
          break;
        }

        case 'add_note':
          await this.prisma.ticketComment.create({
            data: {
              content: action.params.note,
              isInternal: true,
              ticketId: context.ticket.id,
              authorId: context.user?.id || 'system',
            },
          });
          break;

        case 'send_notification':
          await this.prisma.notification.create({
            data: {
              type: 'automation',
              title: action.params.title || 'Automation triggered',
              body: action.params.body || '',
              userId: action.params.userId,
            },
          });
          break;

        case 'close_ticket':
          await this.prisma.ticket.update({
            where: { id: context.ticket.id },
            data: { status: 'CLOSED', closedAt: new Date() },
          });
          break;
      }
    }
  }
}
