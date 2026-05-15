import { z } from 'zod';
export const QueryKnowledgeSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  published: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'helpfulCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type QueryKnowledgeDto = z.infer<typeof QueryKnowledgeSchema>;
