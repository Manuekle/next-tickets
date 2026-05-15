import { z } from 'zod';
import { Role } from '@prisma/client';
export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
