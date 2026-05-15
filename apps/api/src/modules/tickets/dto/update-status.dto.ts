import { z } from 'zod';
import { TicketStatus } from '@prisma/client';
export const UpdateStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});
export type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;
