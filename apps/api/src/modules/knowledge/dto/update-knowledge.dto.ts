import { z } from 'zod';
export const UpdateKnowledgeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(300).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  published: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.string().optional(),
});
export type UpdateKnowledgeDto = z.infer<typeof UpdateKnowledgeSchema>;
