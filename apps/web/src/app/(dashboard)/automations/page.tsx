'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, PencilEdit01Icon, Delete01Icon, WorkflowSquare01Icon, Cancel01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';

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

/* ─── small UI primitives ─── */

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '8px 10px',
  fontSize:     '13px',
  color:        'var(--ink)',
  border:       0,
  borderRadius: '8px',
  background:   'var(--surface)',
  boxShadow:    'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
  outline:      'none',
  boxSizing:    'border-box',
  fontFamily:   'inherit',
  transition:   'box-shadow 100ms',
};

function NativeSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <HugeiconsIcon icon={ArrowDown01Icon} size={12} color="var(--mute)" style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
    >
      <div style={{
        width: '32px', height: '18px', borderRadius: '999px', position: 'relative',
        background: checked ? 'var(--accent)' : 'var(--surface-3)',
        transition: 'background 150ms',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          position: 'absolute', top: '2px',
          left: checked ? '16px' : '2px',
          width: '14px', height: '14px', borderRadius: '999px',
          background: '#fff', transition: 'left 150ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{children}</div>;
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
              <NativeSelect value={field.value || ''} onChange={field.onChange} options={users?.data.map((u) => ({ value: u.id, label: u.name })) ?? []} placeholder="Select user" />
            )} />
          </div>
        );
      case 'set_priority':
        return (
          <div>
            <FieldLabel>Priority</FieldLabel>
            <Controller control={control} name={`actions.${index}.params.priority`} render={({ field }) => (
              <NativeSelect value={field.value || ''} onChange={field.onChange} options={priorityOptions} placeholder="Select priority" />
            )} />
          </div>
        );
      case 'set_status':
        return (
          <div>
            <FieldLabel>Status</FieldLabel>
            <Controller control={control} name={`actions.${index}.params.status`} render={({ field }) => (
              <NativeSelect value={field.value || ''} onChange={field.onChange} options={statusOptions} placeholder="Select status" />
            )} />
          </div>
        );
      case 'add_tags':
        return (
          <div>
            <FieldLabel>Tag Name</FieldLabel>
            <input {...register(`actions.${index}.params.tagName`)} placeholder="e.g. urgent" style={inputStyle} />
          </div>
        );
      case 'add_note':
        return (
          <div>
            <FieldLabel>Note Content</FieldLabel>
            <textarea {...register(`actions.${index}.params.note`)} rows={3} placeholder="Internal note text…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
        );
      case 'send_notification':
        return (
          <>
            <div>
              <FieldLabel>User</FieldLabel>
              <Controller control={control} name={`actions.${index}.params.userId`} render={({ field }) => (
                <NativeSelect value={field.value || ''} onChange={field.onChange} options={users?.data.map((u) => ({ value: u.id, label: u.name })) ?? []} placeholder="Select user" />
              )} />
            </div>
            <div>
              <FieldLabel>Title</FieldLabel>
              <input {...register(`actions.${index}.params.title`)} placeholder="Notification title" style={inputStyle} />
            </div>
            <div>
              <FieldLabel>Body</FieldLabel>
              <textarea {...register(`actions.${index}.params.body`)} rows={2} placeholder="Notification body" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </>
        );
      case 'assign_team':
      case 'close_ticket':
        return <p style={{ fontSize: '12px', color: 'var(--mute)', fontStyle: 'italic' }}>No additional parameters needed.</p>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,18,30,0.32)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(640px, 100%)', background: 'var(--surface)', borderRadius: '18px', boxShadow: '0 24px 60px -20px rgba(15,18,30,0.30)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--hairline)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0 }}>
            {isEdit ? 'Edit automation rule' : 'Create automation rule'}
          </h2>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'var(--surface-2)', color: 'var(--mute)', cursor: 'pointer' }}>
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit(onSubmit)} id="automation-form" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Name */}
            <div>
              <FieldLabel>Name *</FieldLabel>
              <input {...register('name')} placeholder="Rule name" style={inputStyle} />
              {errors.name && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea {...register('description')} rows={2} placeholder="Optional description" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            {/* Trigger */}
            <div>
              <FieldLabel>Trigger *</FieldLabel>
              <Controller control={control} name="trigger" render={({ field }) => (
                <NativeSelect value={field.value || ''} onChange={field.onChange} options={triggerOptions} placeholder="Select trigger" />
              )} />
              {errors.trigger && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors.trigger.message}</p>}
            </div>

            {/* Conditions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <FieldLabel>Conditions</FieldLabel>
                <button type="button" onClick={() => addCond({ field: 'priority', operator: 'equals', value: '' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, border: 0, borderRadius: '7px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                  <HugeiconsIcon icon={Add01Icon} size={11} /> Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {condFields.map((field, index) => (
                  <div key={field.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'var(--surface-2)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <Controller control={control} name={`conditions.${index}.field`} render={({ field: f }) => (
                        <NativeSelect value={f.value || ''} onChange={f.onChange} options={conditionFieldOptions} placeholder="Field" />
                      )} />
                      <Controller control={control} name={`conditions.${index}.operator`} render={({ field: f }) => (
                        <NativeSelect value={f.value || ''} onChange={f.onChange} options={operatorOptions} placeholder="Operator" />
                      )} />
                      <input {...register(`conditions.${index}.value`)} placeholder="Value" style={inputStyle} />
                    </div>
                    <button type="button" onClick={() => removeCond(index)} style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'oklch(0.50 0.20 22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <HugeiconsIcon icon={Delete01Icon} size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <FieldLabel>Actions *</FieldLabel>
                <button type="button" onClick={() => addAct({ type: 'assign_user', params: { userId: '' } } as any)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, border: 0, borderRadius: '7px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                  <HugeiconsIcon icon={Add01Icon} size={11} /> Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actFields.map((field, index) => (
                  <div key={field.id} style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <Controller control={control} name={`actions.${index}.type`} render={({ field: f }) => (
                          <NativeSelect
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
                      <button type="button" onClick={() => removeAct(index)} style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'oklch(0.50 0.20 22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HugeiconsIcon icon={Delete01Icon} size={13} />
                      </button>
                    </div>
                    {renderActionParams(index)}
                  </div>
                ))}
              </div>
              {errors.actions && <p style={{ fontSize: '11px', color: 'oklch(0.50 0.20 22)', marginTop: '4px' }}>{errors.actions.message as string}</p>}
            </div>

            {/* Active toggle */}
            <Toggle checked={!!isActive} onChange={(v) => setValue('isActive', v)} label="Active rule" />
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--surface-2)' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: 0, borderRadius: '9px', background: 'var(--surface)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            Cancel
          </button>
          <button type="submit" form="automation-form" disabled={isPending} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '9px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, boxShadow: '0 4px 12px -4px var(--accent-glow)' }}>
            {isPending ? 'Saving…' : isEdit ? 'Update rule' : 'Create rule'}
          </button>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '60px 0' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'oklch(0.50 0.20 22)' }}>Failed to load automations</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['automations'] })} style={{ padding: '7px 14px', fontSize: '13px', fontWeight: 500, border: 0, borderRadius: '9px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>
            Automations
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>
            {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px -4px var(--accent-glow)' }}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} /> New Rule
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '16px', width: '60%', background: 'var(--surface-2)', borderRadius: '6px' }} />
              <div style={{ height: '13px', width: '100%', background: 'var(--surface-2)', borderRadius: '6px' }} />
              <div style={{ height: '13px', width: '40%', background: 'var(--surface-2)', borderRadius: '6px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && rules.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '80px 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)' }}>
            <HugeiconsIcon icon={WorkflowSquare01Icon} size={24} />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink)', margin: 0 }}>No automation rules yet</p>
          <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>Create rules to automate repetitive ticket workflows.</p>
          <button onClick={openCreate} style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px -4px var(--accent-glow)' }}>
            <HugeiconsIcon icon={Add01Icon} size={14} /> Create Rule
          </button>
        </div>
      )}

      {/* Rules grid */}
      {!isLoading && rules.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {rules.map((rule) => (
            <div key={rule.id} style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 18px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em', margin: 0, lineHeight: 1.3 }}>{rule.name}</p>
                  <span style={{
                    flexShrink: 0,
                    padding: '2px 7px', fontSize: '10.5px', fontWeight: 600, borderRadius: '5px',
                    background: rule.isActive ? 'oklch(0.92 0.06 148)' : 'var(--surface-2)',
                    color:      rule.isActive ? 'oklch(0.40 0.16 148)' : 'var(--mute)',
                  }}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {rule.description && <p style={{ fontSize: '12px', color: 'var(--mute)', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rule.description}</p>}

                {/* Trigger */}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-flex', padding: '3px 8px', fontSize: '11px', fontWeight: 500, borderRadius: '6px', background: 'var(--accent-tint)', color: 'var(--accent)' }}>
                    ⚡ {getTriggerLabel(rule.trigger)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {rule.actions.map((a, i) => (
                    <span key={i} style={{ padding: '2px 7px', fontSize: '11px', fontWeight: 500, borderRadius: '5px', background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>
                      {getActionSummary(a)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Toggle
                  checked={rule.isActive}
                  onChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                  label={rule.isActive ? 'On' : 'Off'}
                />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(rule)} style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 100ms' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--mute)'; }}>
                    <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                  </button>
                  <button onClick={() => { if (window.confirm('Delete this rule?')) deleteMutation.mutate(rule.id); }} style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 100ms' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.96 0.04 22)'; (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.50 0.20 22)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--mute)'; }}>
                    <HugeiconsIcon icon={Delete01Icon} size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AutomationDialog open={dialogOpen} onClose={closeDialog} editRule={editRule} />
    </div>
  );
}
