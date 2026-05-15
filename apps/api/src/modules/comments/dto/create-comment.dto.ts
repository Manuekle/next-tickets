import { z } from 'zod';
export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(false),
});
export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
