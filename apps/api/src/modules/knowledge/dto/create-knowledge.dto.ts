import { z } from 'zod';
export const CreateKnowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(300).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  published: z.boolean().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
});
export type CreateKnowledgeDto = z.infer<typeof CreateKnowledgeSchema>;
