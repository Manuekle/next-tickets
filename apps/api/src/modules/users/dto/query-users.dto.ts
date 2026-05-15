import { z } from 'zod';
import { Role } from '@prisma/client';
export const QueryUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  role: z.nativeEnum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().optional(),
});
export type QueryUsersDto = z.infer<typeof QueryUsersSchema>;
