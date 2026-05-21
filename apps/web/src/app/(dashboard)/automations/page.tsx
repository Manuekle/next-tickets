'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, PencilEdit01Icon, Delete01Icon, WorkflowSquare01Icon, FlashIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import {
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  Card,
  EmptyState,
  Skeleton,
} from '@/components/ui';

/* ─── constants ─── */

const triggerOptions = [
  { value: 'ticket.created',        label: 'Ticket Created'       },
  { value: 'ticket.updated',        label: 'Ticket Updated'       },
  { value: 'ticket.status_changed', label: 'Status Changed'       },
  { value: 'ticket.priority_changed', label: 'Priority Changed'   },
  { value: 'sla.breached',          label: 'SLA Breached'         },
] as const;

const conditionFieldOptions = [
  { value: 'priority',   label: 'Priority'    },
  { value: 'status',     label: 'Status'      },
  { value: 'category',   label: 'Category'    },
  { value: 'assignedTo', label: 'Assigned To' },
] as const;

const operatorOptions = [
  { value: 'equals',     label: 'Equals'     },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains',   label: 'Contains'   },
] as const;

const actionTypeOptions = [
  { value: 'assign_user',       label: 'Assign to User'       },
  { value: 'assign_team',       label: 'Assign to Team'       },
  { value: 'set_priority',      label: 'Set Priority'         },
  { value: 'set_status',        label: 'Set Status'           },
  { value: 'add_tags',          label: 'Add Tags'             },
  { value: 'add_note',          label: 'Add Internal Note'    },
  { value: 'send_notification', label: 'Send Notification'    },
  { value: 'close_ticket',      label: 'Close Ticket'         },
] as const;

const priorityOptions = [
  { value: 'LOW',      label: 'Low'      },
  { value: 'MEDIUM',   label: 'Medium'   },
  { value: 'HIGH',     label: 'High'     },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

const statusOptions = [
  { value: 'OPEN',                label: 'Open'                },
  { value: 'IN_PROGRESS',         label: 'In Progress'         },
  { value: 'WAITING_ON_CUSTOMER', label: 'Waiting on Customer' },
  { value: 'RESOLVED',            label: 'Resolved'            },
  { value: 'CLOSED',              label: 'Closed'              },
] as const;

const defaultActionParams: Record<string, Record<string, string>> = {
  assign_user:       { userId: '' },
  assign_team:       {},
  set_priority:      { priority: '' },
  set_status:        { status: '' },
  add_tags:          { tagName: '' },
  add_note:          { note: '' },
  send_notification: { userId: '', title: '', body: '' },
  close_ticket:      {},
};

/* ─── schema ─── */

const conditionSchema = z.object({
  field:    z.string().min(1, 'Field is required'),
  operator: z.string().min(1, 'Operator is required'),
  value:    z.string().min(1, 'Value is required'),
});

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('assign_user'),       params: z.object({ userId: z.string().min(1) }) }),
  z.object({ type: z.literal('assign_team'),       params: z.object({}).optional() }),
  z.object({ type: z.literal('set_priority'),      params: z.object({ priority: z.string().min(1) }) }),
  z.object({ type: z.literal('set_status'),        params: z.object({ status: z.string().min(1) }) }),
  z.object({ type: z.literal('add_tags'),          params: z.object({ tagName: z.string().min(1) }) }),
  z.object({ type: z.literal('add_note'),          params: z.object({ note: z.string().min(1) }) }),
  z.object({ type: z.literal('send_notification'), params: z.object({ userId: z.string().min(1), title: z.string().min(1), body: z.string().min(1) }) }),
  z.object({ type: z.literal('close_ticket'),      params: z.object({}).optional() }),
]);

const formSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  trigger:     z.string().min(1, 'Trigger is required'),
  conditions:  z.array(conditionSchema).optional().default([]),
  actions:     z.array(actionSchema).min(1, 'At least one action is required'),
  isActive:    z.boolean().optional().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AutomationRule {
  id:          string;
  name:        string;
  description?: string;
  trigger:     string;
  conditions:  { field: string; operator: string; value: string }[];
  actions:     { type: string; params: Record<string, any> }[];
  isActive:    boolean;
  createdAt:   string;
}

/* ─── helpers ─── */

function getTriggerLabel(trigger: string) {
  return triggerOptions.find((o) => o.value === trigger)?.label ?? trigger;
}

function getActionSummary(action: { type: string; params: Record<string, any> }) {
  const p = action.params || {};
  switch (action.type) {
    case 'assign_user':       return `Assign: ${p.userId || '?'}`;
    case 'assign_team':       return 'Auto-assign';
    case 'set_priority':      return `Priority: ${p.priority || '?'}`;
    case 'set_status':        return `Status: ${p.status || '?'}`;
    case 'add_tags':          return `Tag: ${p.tagName || '?'}`;
    case 'add_note':          return 'Add note';
    case 'send_notification': return `Notify: ${p.title || '?'}`;
    case 'close_ticket':      return 'Close ticket';
    default:                  return action.type;
  }
}

/* ─── small UI helpers ─── */

function FieldSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select
      value={value || ''}
      onValueChange={(v) => onChange((v as string) ?? '')}
      items={options as { value: string; label: string }[]}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute">{children}</div>;
}

/* ─── dialog ─── */

function AutomationDialog({ open, onClose, editRule }: {
  open: boolean; onClose: () => void; editRule?: AutomationRule | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editRule;

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn:  () => apiClient<{ data: { id: string; name: string }[] }>('/users'),
  });

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver:     zodResolver(formSchema),
    defaultValues: { name: '', description: '', trigger: '', conditions: [], actions: [{ type: 'assign_user', params: { userId: '' } }], isActive: true },
  });

  const { fields: condFields, append: addCond, remove: removeCond } = useFieldArray({ control, name: 'conditions' });
  const { fields: actFields,  append: addAct,  remove: removeAct  } = useFieldArray({ control, name: 'actions'    });
  const watchActions = watch('actions');
  const isActive = watch('isActive');

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiClient('/automations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); sileo.success({ title: 'Rule created' }); onClose(); reset(); },
    onError:   () => sileo.error({ title: 'Failed to create automation' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => apiClient(`/automations/${editRule!.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); sileo.success({ title: 'Rule updated' }); onClose(); reset(); },
    onError:   () => sileo.error({ title: 'Failed to update automation' }),
  });

  const onSubmit = (data: FormValues) => isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  const renderActionParams = (index: number) => {
    const action = watchActions?.[index];
    if (!action) return null;
    switch (action.type) {
      case 'assign_user':
        return (
          <div>
            <FieldLabel>User</FieldLabel>
            <Controller control={control} name={`actions.${index}.params.userId`} render={({ field }) => (
              <FieldSelect value={field.value || ''} onChange={field.onChange} options={users?.data.map((u) => ({ value: u.id, label: u.name })) ?? []} placeholder="Select user" />
            )} />
          </div>
        );
      case 'set_priority':
        return (
          <div>
            <FieldLabel>Priority</FieldLabel>
            <Controller control={control} name={`actions.${index}.params.priority`} render={({ field }) => (
              <FieldSelect value={field.value || ''} onChange={field.onChange} options={priorityOptions} placeholder="Select priority" />
            )} />
          </div>
        );
      case 'set_status':
        return (
          <div>
            <FieldLabel>Status</FieldLabel>
            <Controller control={control} name={`actions.${index}.params.status`} render={({ field }) => (
              <FieldSelect value={field.value || ''} onChange={field.onChange} options={statusOptions} placeholder="Select status" />
            )} />
          </div>
        );
      case 'add_tags':
        return (
          <div>
            <FieldLabel>Tag Name</FieldLabel>
            <Input {...register(`actions.${index}.params.tagName`)} placeholder="e.g. urgent" />
          </div>
        );
      case 'add_note':
        return (
          <div>
            <FieldLabel>Note Content</FieldLabel>
            <Textarea {...register(`actions.${index}.params.note`)} rows={3} placeholder="Internal note text…" />
          </div>
        );
      case 'send_notification':
        return (
          <>
            <div>
              <FieldLabel>User</FieldLabel>
              <Controller control={control} name={`actions.${index}.params.userId`} render={({ field }) => (
                <FieldSelect value={field.value || ''} onChange={field.onChange} options={users?.data.map((u) => ({ value: u.id, label: u.name })) ?? []} placeholder="Select user" />
              )} />
            </div>
            <div>
              <FieldLabel>Title</FieldLabel>
              <Input {...register(`actions.${index}.params.title`)} placeholder="Notification title" />
            </div>
            <div>
              <FieldLabel>Body</FieldLabel>
              <Textarea {...register(`actions.${index}.params.body`)} rows={2} placeholder="Notification body" />
            </div>
          </>
        );
      case 'assign_team':
      case 'close_ticket':
        return <p className="text-xs italic text-mute">No additional parameters needed.</p>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-[min(640px,100%)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-ink">
            {isEdit ? 'Edit automation rule' : 'Create automation rule'}
          </h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} id="automation-form" className="flex flex-col gap-4 px-6 py-5">
            {/* Name */}
            <div>
              <FieldLabel>Name *</FieldLabel>
              <Input {...register('name')} placeholder="Rule name" />
              {errors.name && <p className="mt-1 text-[11px] text-danger">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <Textarea {...register('description')} rows={2} placeholder="Optional description" />
            </div>

            {/* Trigger */}
            <div>
              <FieldLabel>Trigger *</FieldLabel>
              <Controller control={control} name="trigger" render={({ field }) => (
                <FieldSelect value={field.value || ''} onChange={field.onChange} options={triggerOptions} placeholder="Select trigger" />
              )} />
              {errors.trigger && <p className="mt-1 text-[11px] text-danger">{errors.trigger.message}</p>}
            </div>

            {/* Conditions */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <FieldLabel>Conditions</FieldLabel>
                <Button variant="secondary" size="sm" onClick={() => addCond({ field: 'priority', operator: 'equals', value: '' })}>
                  <HugeiconsIcon icon={Add01Icon} size={11} /> Add
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {condFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 rounded-lg bg-surface-2 p-3">
                    <div className="grid flex-1 grid-cols-3 gap-2">
                      <Controller control={control} name={`conditions.${index}.field`} render={({ field: f }) => (
                        <FieldSelect value={f.value || ''} onChange={f.onChange} options={conditionFieldOptions} placeholder="Field" />
                      )} />
                      <Controller control={control} name={`conditions.${index}.operator`} render={({ field: f }) => (
                        <FieldSelect value={f.value || ''} onChange={f.onChange} options={operatorOptions} placeholder="Operator" />
                      )} />
                      <Input {...register(`conditions.${index}.value`)} placeholder="Value" />
                    </div>
                    <Button variant="ghost" size="icon-sm" className="mt-0.5 shrink-0 text-mute hover:text-danger" onClick={() => removeCond(index)} aria-label="Remove condition">
                      <HugeiconsIcon icon={Delete01Icon} size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <FieldLabel>Actions *</FieldLabel>
                <Button variant="secondary" size="sm" onClick={() => addAct({ type: 'assign_user', params: { userId: '' } } as any)}>
                  <HugeiconsIcon icon={Add01Icon} size={11} /> Add
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {actFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2.5 rounded-lg bg-surface-2 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Controller control={control} name={`actions.${index}.type`} render={({ field: f }) => (
                          <FieldSelect
                            value={f.value || ''}
                            onChange={(type) => {
                              f.onChange(type);
                              setValue(`actions.${index}.params`, (defaultActionParams[type] || {}) as any);
                            }}
                            options={actionTypeOptions}
                            placeholder="Select action"
                          />
                        )} />
                      </div>
                      <Button variant="ghost" size="icon-sm" className="shrink-0 text-mute hover:text-danger" onClick={() => removeAct(index)} aria-label="Remove action">
                        <HugeiconsIcon icon={Delete01Icon} size={13} />
                      </Button>
                    </div>
                    {renderActionParams(index)}
                  </div>
                ))}
              </div>
              {errors.actions && <p className="mt-1 text-[11px] text-danger">{errors.actions.message as string}</p>}
            </div>

            {/* Active toggle */}
            <Label className="flex w-fit cursor-pointer items-center gap-2">
              <Switch checked={!!isActive} onCheckedChange={(v: boolean) => setValue('isActive', v)} />
              Active rule
            </Label>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-border bg-surface-2 px-6 py-3.5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="automation-form" disabled={isPending}>
            {isPending ? 'Saving…' : isEdit ? 'Update rule' : 'Create rule'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── main page ─── */

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['automations'],
    queryFn:  () => apiClient<{ data: AutomationRule[] }>('/automations'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/automations/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); sileo.success({ title: 'Rule status updated' }); },
    onError:   () => sileo.error({ title: 'Failed to update rule' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/automations/${id}`, { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); sileo.success({ title: 'Rule deleted' }); },
    onError:   () => sileo.error({ title: 'Failed to delete rule' }),
  });

  const rules = data?.data ?? [];

  const openCreate = () => { setEditRule(null); setDialogOpen(true); };
  const openEdit   = (rule: AutomationRule) => { setEditRule(rule); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditRule(null); };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2.5 py-16">
        <p className="text-sm font-medium text-danger">Failed to load automations</p>
        <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['automations'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page head */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-ink">Automations</h1>
          <p className="mt-1.5 text-[13px] text-mute">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <HugeiconsIcon icon={Add01Icon} size={14} /> New Rule
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-3.5">
          {[1,2,3,4,5,6].map((i) => (
            <Card key={i} className="flex flex-col gap-2.5 p-[18px]">
              <Skeleton width="60%" height={16} />
              <Skeleton width="100%" height={13} />
              <Skeleton width="40%" height={13} />
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && rules.length === 0 && (
        <EmptyState
          icon={WorkflowSquare01Icon}
          title="No automation rules yet"
          description="Create rules to automate repetitive ticket workflows."
          action={
            <Button variant="primary" onClick={openCreate}>
              <HugeiconsIcon icon={Add01Icon} size={14} /> Create Rule
            </Button>
          }
        />
      )}

      {/* Rules grid */}
      {!isLoading && rules.length > 0 && (
        <div className="grid grid-cols-3 gap-3.5">
          {rules.map((rule) => (
            <Card key={rule.id} className="flex flex-col overflow-hidden">
              <div className="flex-1 p-4">
                <div className="mb-2.5 flex items-start justify-between gap-2.5">
                  <p className="text-[13.5px] font-semibold leading-tight text-ink">{rule.name}</p>
                  <Badge variant={rule.isActive ? 'success' : 'neutral'} className="shrink-0">
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {rule.description && (
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-mute">{rule.description}</p>
                )}

                {/* Trigger */}
                <div className="mb-2">
                  <Badge variant="info" className="gap-1">
                    <HugeiconsIcon icon={FlashIcon} size={11} /> {getTriggerLabel(rule.trigger)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1">
                  {rule.actions.map((a, i) => (
                    <Badge key={i} variant="neutral">{getActionSummary(a)}</Badge>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <Label className="flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked: boolean) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                  />
                  {rule.isActive ? 'On' : 'Off'}
                </Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(rule)} aria-label="Edit rule">
                    <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-mute hover:text-danger" onClick={() => { if (window.confirm('Delete this rule?')) deleteMutation.mutate(rule.id); }} aria-label="Delete rule">
                    <HugeiconsIcon icon={Delete01Icon} size={13} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AutomationDialog open={dialogOpen} onClose={closeDialog} editRule={editRule} />
    </div>
  );
}
