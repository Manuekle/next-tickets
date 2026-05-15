import { z } from 'zod';
export const AssignTicketSchema = z.object({
  agentId: z.string(),
});
export type AssignTicketDto = z.infer<typeof AssignTicketSchema>;
