import { z } from 'zod';
import { TicketPriority } from '@prisma/client';

export const UpdateSlaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  firstResponseHours: z.number().positive().optional(),
  resolutionHours: z.number().positive().optional(),
  priority: z.nativeEnum(TicketPriority).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateSlaDto = z.infer<typeof UpdateSlaSchema>;
