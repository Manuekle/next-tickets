import { z } from 'zod';
export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
