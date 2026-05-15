import { z } from 'zod';
import { Role } from '@prisma/client';
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  role: z.nativeEnum(Role).optional().default(Role.CUSTOMER),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
