import { z } from 'zod';
import { TicketPriority } from '@prisma/client';

export const CreateSlaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  firstResponseHours: z.number().positive(),
  resolutionHours: z.number().positive(),
  priority: z.nativeEnum(TicketPriority).optional(),
  isActive: z.boolean().optional(),
});

export type CreateSlaDto = z.infer<typeof CreateSlaSchema>;
