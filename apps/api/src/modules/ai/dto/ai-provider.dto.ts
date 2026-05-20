import { z } from 'zod';

export const AiProviderTypeSchema = z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'OPENROUTER', 'GROQ']);

export const CreateAiProviderSchema = z.object({
  type: AiProviderTypeSchema,
  label: z.string().min(1).max(80),
  apiKey: z.string().min(8).max(512),
  model: z.string().min(1).max(120),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
  enabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  rateLimitRpm: z.number().int().min(1).max(10000).optional(),
});

export const UpdateAiProviderSchema = CreateAiProviderSchema.partial();

export type CreateAiProviderDto = z.infer<typeof CreateAiProviderSchema>;
export type UpdateAiProviderDto = z.infer<typeof UpdateAiProviderSchema>;
