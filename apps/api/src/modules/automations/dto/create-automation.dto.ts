import { z } from 'zod';

export const TriggerEnum = z.enum([
  'ticket.created',
  'ticket.updated',
  'ticket.status_changed',
  'ticket.priority_changed',
  'sla.breached',
]);

export const ActionTypeEnum = z.enum([
  'assign_user',
  'assign_team',
  'set_priority',
  'set_status',
  'add_tags',
  'add_note',
  'send_notification',
  'close_ticket',
]);

export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
  value: z.any(),
});

export const ActionSchema = z.object({
  type: ActionTypeEnum,
  params: z.record(z.any()).optional().default({}),
});

export const CreateAutomationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  trigger: TriggerEnum,
  conditions: z.array(ConditionSchema).optional().default([]),
  actions: z.array(ActionSchema).min(1),
  isActive: z.boolean().optional().default(true),
});

export type CreateAutomationDto = z.infer<typeof CreateAutomationSchema>;
