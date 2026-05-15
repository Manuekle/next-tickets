import { z } from 'zod';
import { TriggerEnum, ConditionSchema, ActionSchema } from './create-automation.dto';

export const UpdateAutomationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  trigger: TriggerEnum.optional(),
  conditions: z.array(ConditionSchema).optional(),
  actions: z.array(ActionSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAutomationDto = z.infer<typeof UpdateAutomationSchema>;
