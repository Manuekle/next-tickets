import { z } from 'zod';
import { TicketStatus, TicketPriority } from '@prisma/client';
export const QueryTicketsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.union([z.nativeEnum(TicketStatus), z.array(z.nativeEnum(TicketStatus))]).optional(),
  priority: z.union([z.nativeEnum(TicketPriority), z.array(z.nativeEnum(TicketPriority))]).optional(),
  categoryId: z.string().optional(),
  assignedToId: z.string().optional(),
  q: z.string().optional(),
});
export type QueryTicketsDto = z.infer<typeof QueryTicketsSchema>;
