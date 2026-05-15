'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Workflow, GripVertical } from 'lucide-react';

const triggerOptions = [
  { value: 'ticket.created', label: 'Ticket Created' },
  { value: 'ticket.updated', label: 'Ticket Updated' },
  { value: 'ticket.status_changed', label: 'Status Changed' },
  { value: 'ticket.priority_changed', label: 'Priority Changed' },
  { value: 'sla.breached', label: 'SLA Breached' },
] as const;

const conditionFieldOptions = [
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'category', label: 'Category' },
  { value: 'assignedTo', label: 'Assigned To' },
] as const;

const operatorOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
] as const;

const actionTypeOptions = [
  { value: 'assign_user', label: 'Assign to User' },
  { value: 'assign_team', label: 'Assign to Team' },
  { value: 'set_priority', label: 'Set Priority' },
  { value: 'set_status', label: 'Set Status' },
  { value: 'add_tags', label: 'Add Tags' },
  { value: 'add_note', label: 'Add Internal Note' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'close_ticket', label: 'Close Ticket' },
] as const;

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

const statusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_ON_CUSTOMER', label: 'Waiting on Customer' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

const conditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.string().min(1, 'Operator is required'),
  value: z.string().min(1, 'Value is required'),
});

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('assign_user'), params: z.object({ userId: z.string().min(1) }) }),
  z.object({ type: z.literal('assign_team'), params: z.object({}).optional() }),
  z.object({ type: z.literal('set_priority'), params: z.object({ priority: z.string().min(1) }) }),
  z.object({ type: z.literal('set_status'), params: z.object({ status: z.string().min(1) }) }),
  z.object({ type: z.literal('add_tags'), params: z.object({ tagName: z.string().min(1) }) }),
  z.object({ type: z.literal('add_note'), params: z.object({ note: z.string().min(1) }) }),
  z.object({
    type: z.literal('send_notification'),
    params: z.object({ userId: z.string().min(1), title: z.string().min(1), body: z.string().min(1) }),
  }),
  z.object({ type: z.literal('close_ticket'), params: z.object({}).optional() }),
]);

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  trigger: z.string().min(1, 'Trigger is required'),
  conditions: z.array(conditionSchema).optional().default([]),
  actions: z.array(actionSchema).min(1, 'At least one action is required'),
  isActive: z.boolean().optional().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: { field: string; operator: string; value: string }[];
  actions: { type: string; params: Record<string, any> }[];
  isActive: boolean;
  createdAt: string;
}

function getTriggerLabel(trigger: string) {
  return triggerOptions.find((o) => o.value === trigger)?.label || trigger;
}

function getActionLabel(type: string) {
  return actionTypeOptions.find((o) => o.value === type)?.label || type;
}

function getActionParamsSummary(action: { type: string; params: Record<string, any> }) {
  const p = action.params || {};
  switch (action.type) {
    case 'assign_user': return `User: ${p.userId || '?'}`;
    case 'assign_team': return 'Auto-assign';
    case 'set_priority': return `Priority: ${p.priority || '?'}`;
    case 'set_status': return `Status: ${p.status || '?'}`;
    case 'add_tags': return `Tag: ${p.tagName || '?'}`;
    case 'add_note': return 'Add internal note';
    case 'send_notification': return `Notify: ${p.title || '?'}`;
    case 'close_ticket': return 'Close ticket';
    default: return action.type;
  }
}

const defaultActionParams: Record<string, Record<string, string>> = {
  assign_user: { userId: '' },
  assign_team: {},
  set_priority: { priority: '' },
  set_status: { status: '' },
  add_tags: { tagName: '' },
  add_note: { note: '' },
  send_notification: { userId: '', title: '', body: '' },
  close_ticket: {},
};

function AutomationFormDialog({
  open,
  onOpenChange,
  editRule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: AutomationRule | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editRule;

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient<{ data: { id: string; name: string }[] }>('/users'),
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger: '',
      conditions: [],
      actions: [{ type: 'assign_user', params: { userId: '' } }],
      isActive: true,
    },
  });

  const { fields: conditionFields, append: addCondition, remove: removeCondition } = useFieldArray({
    control,
    name: 'conditions',
  });

  const {
    fields: actionFields,
    append: addAction,
    remove: removeAction,
    update: updateAction,
  } = useFieldArray({
    control,
    name: 'actions',
  });

  const watchActions = watch('actions');

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiClient('/automations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation rule created');
      onOpenChange(false);
      reset();
    },
    onError: () => toast.error('Failed to create automation'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiClient(`/automations/${editRule!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automation rule updated');
      onOpenChange(false);
      reset();
    },
    onError: () => toast.error('Failed to update automation'),
  });

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpen = (open: boolean) => {
    onOpenChange(open);
    if (open && editRule) {
      reset({
        name: editRule.name,
        description: editRule.description || '',
        trigger: editRule.trigger,
        conditions: editRule.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: String(c.value),
        })),
        actions: editRule.actions.map((a) => ({
          type: a.type as any,
          params: a.params || defaultActionParams[a.type] || {},
        })),
        isActive: editRule.isActive,
      });
    } else if (open && !editRule) {
      reset({
        name: '',
        description: '',
        trigger: '',
        conditions: [],
        actions: [{ type: 'assign_user', params: { userId: '' } }],
        isActive: true,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const renderActionParams = (index: number) => {
    const action = watchActions?.[index];
    if (!action) return null;
    const type = action.type;

    switch (type) {
      case 'assign_user':
        return (
          <div className="space-y-2">
            <Label>User</Label>
            <Controller
              control={control}
              name={`actions.${index}.params.userId`}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.data.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        );
      case 'set_priority':
        return (
          <div className="space-y-2">
            <Label>Priority</Label>
            <Controller
              control={control}
              name={`actions.${index}.params.priority`}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        );
      case 'set_status':
        return (
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name={`actions.${index}.params.status`}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        );
      case 'add_tags':
        return (
          <div className="space-y-2">
            <Label>Tag Name</Label>
            <Input {...register(`actions.${index}.params.tagName`)} placeholder="e.g. urgent" />
          </div>
        );
      case 'add_note':
        return (
          <div className="space-y-2">
            <Label>Note Content</Label>
            <Textarea {...register(`actions.${index}.params.note`)} rows={3} placeholder="Internal note text..." />
          </div>
        );
      case 'send_notification':
        return (
          <>
            <div className="space-y-2">
              <Label>User</Label>
              <Controller
                control={control}
                name={`actions.${index}.params.userId`}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.data.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register(`actions.${index}.params.title`)} placeholder="Notification title" />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea {...register(`actions.${index}.params.body`)} rows={2} placeholder="Notification body" />
            </div>
          </>
        );
      case 'assign_team':
      case 'close_ticket':
        return <p className="text-sm text-muted-foreground">No additional parameters needed.</p>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Automation Rule' : 'Create Automation Rule'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modify the automation rule settings below.' : 'Define a new automation rule for ticket workflows.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="Rule name" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={2} placeholder="Optional description" />
          </div>

          <div className="space-y-2">
            <Label>Trigger</Label>
            <Controller
              control={control}
              name="trigger"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.trigger && <p className="text-sm text-destructive">{errors.trigger.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addCondition({ field: 'priority', operator: 'equals', value: '' })}>
                <Plus className="h-3 w-3 mr-1" /> Add Condition
              </Button>
            </div>
            {conditionFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-2">
                  <Controller
                    control={control}
                    name={`conditions.${index}.field`}
                    render={({ field: f }) => (
                      <Select value={f.value || ''} onValueChange={(v) => f.onChange(v || '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionFieldOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`conditions.${index}.operator`}
                    render={({ field: f }) => (
                      <Select value={f.value || ''} onValueChange={(v) => f.onChange(v || '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input {...register(`conditions.${index}.value`)} placeholder="Value" />
                </div>
                <Button type="button" variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => removeCondition(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.conditions && <p className="text-sm text-destructive">{errors.conditions.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Actions</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addAction({ type: 'assign_user', params: { userId: '' } } as any)}>
                <Plus className="h-3 w-3 mr-1" /> Add Action
              </Button>
            </div>
            {actionFields.map((field, index) => {
              const action = watchActions?.[index];
              return (
                <div key={field.id} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Controller
                        control={control}
                        name={`actions.${index}.type`}
                        render={({ field: f }) => (
                          <Select
                            value={f.value || ''}
                            onValueChange={(v) => {
                              const type = v as keyof typeof defaultActionParams;
                              f.onChange(type);
                              const params = defaultActionParams[type] || {};
                              setValue(`actions.${index}.params`, params as any);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Action type" />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypeOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeAction(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {action && renderActionParams(index)}
                </div>
              );
            })}
            {errors.actions && <p className="text-sm text-destructive">{errors.actions.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value || false} onCheckedChange={(checked) => field.onChange(checked)} />
              )}
            />
            <Label>Active</Label>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" loading={isPending}>
              {isEdit ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['automations'],
    queryFn: () =>
      apiClient<{ data: AutomationRule[] }>('/automations'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/automations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Rule status updated');
    },
    onError: () => toast.error('Failed to update rule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/automations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Rule deleted');
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  const rules = data?.data || [];

  const handleEdit = (rule: AutomationRule) => {
    setEditRule(rule);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditRule(null);
    setDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive font-medium">Failed to load automations</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
        <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['automations'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No automation rules yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first rule to automate ticket workflows.
          </p>
          <Button className="mt-4" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create Rule
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate">{rule.name}</CardTitle>
                    {rule.description && (
                      <CardDescription className="mt-1 line-clamp-2">{rule.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Badge variant="secondary" className="w-fit">
                  {getTriggerLabel(rule.trigger)}
                </Badge>

                {rule.conditions && rule.conditions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.conditions.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {c.field} {c.operator.replace('_', ' ')} {String(c.value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.actions.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {getActionParamsSummary(a)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: rule.id, isActive: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(rule)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this rule?')) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AutomationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editRule={editRule}
      />
    </div>
  );
}
