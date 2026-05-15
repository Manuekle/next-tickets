import { z } from 'zod';
import { TicketPriority } from '@prisma/client';
export const CreateTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  priority: z.nativeEnum(TicketPriority).optional().default(TicketPriority.MEDIUM),
  categoryId: z.string().optional(),
});
export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;
