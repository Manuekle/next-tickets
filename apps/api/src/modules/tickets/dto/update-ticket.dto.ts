import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';
export const UpdateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  categoryId: z.string().nullable().optional(),
});
export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;
