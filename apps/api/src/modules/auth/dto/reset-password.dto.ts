import { z } from 'zod';
export const ResetPasswordSchema = z.object({ token: z.string().min(1), password: z.string().min(8).max(128) });
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
