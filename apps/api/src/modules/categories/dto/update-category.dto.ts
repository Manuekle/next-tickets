import { z } from 'zod';
export const UpdateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
