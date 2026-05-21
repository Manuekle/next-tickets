'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, PencilEdit01Icon, Delete01Icon } from '@hugeicons/core-free-icons';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface SlaRule {
  id: string;
  name: string;
  description: string | null;
  firstResponseHours: number;
  resolutionHours: number;
  priority: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SlaForm {
  name: string;
  description: string;
  firstResponseHours: number;
  resolutionHours: number;
  priority: string;
  isActive: boolean;
}

const defaultForm: SlaForm = {
  name: '',
  description: '',
  firstResponseHours: 1,
  resolutionHours: 24,
  priority: '',
  isActive: true,
};

const priorityVariant: Record<string, BadgeProps['variant']> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function SlaRulesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<SlaRule | null>(null);
  const [form, setForm] = useState<SlaForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['sla-rules'],
    queryFn: () => apiClient<{ data: SlaRule[] }>('/sla'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Partial<SlaForm> }) =>
      payload.id
        ? apiClient(`/sla/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload.body) })
        : apiClient('/sla', { method: 'POST', body: JSON.stringify(payload.body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      setModalOpen(false);
      setEditingRule(null);
      setForm(defaultForm);
      sileo.success({ title: editingRule ? 'Rule updated' : 'Rule created' });
    },
    onError: () => sileo.error({ title: 'Failed to save rule' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/sla/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      setDeleteId(null);
      setDeleteOpen(false);
      sileo.success({ title: 'Rule deleted' });
    },
    onError: () => sileo.error({ title: 'Failed to delete rule' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/sla/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sla-rules'] }),
    onError: () => sileo.error({ title: 'Failed to toggle rule' }),
  });

  function openCreate() {
    setEditingRule(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(rule: SlaRule) {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description || '',
      firstResponseHours: rule.firstResponseHours,
      resolutionHours: rule.resolutionHours,
      priority: rule.priority || '',
      isActive: rule.isActive,
    });
    setModalOpen(true);
  }

  function handleSave() {
    const body: Partial<SlaForm> = {
      name: form.name,
      description: form.description || undefined,
      firstResponseHours: form.firstResponseHours,
      resolutionHours: form.resolutionHours,
      isActive: form.isActive,
    };
    if (form.priority) body.priority = form.priority;
    else body.priority = undefined as any;
    saveMutation.mutate({ id: editingRule?.id, body });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>SLA Rules</h1>
          <p className="mt-1.5 text-[13px] text-mute">Manage Service Level Agreement rules</p>
        </div>
        <Button onClick={openCreate}>
          <HugeiconsIcon icon={Add01Icon} size={13} />
          Create Rule
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-2 hover:bg-surface-2">
              {['Name', 'Priority', 'First Response', 'Resolution', 'Status', 'Created', 'Actions'].map((h) => (
                <TableHead key={h} className="px-4">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="px-4">
                    <Skeleton height={20} radius={6} />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-10 text-center text-mute">No SLA rules found</TableCell>
              </TableRow>
            ) : (
              data?.data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="px-4 font-medium text-ink">{rule.name}</TableCell>
                  <TableCell className="px-4">
                    {rule.priority ? (
                      <Badge variant={priorityVariant[rule.priority] ?? 'neutral'}>{rule.priority}</Badge>
                    ) : (
                      <span className="text-xs text-mute">All</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-ink-soft">{rule.firstResponseHours}h</TableCell>
                  <TableCell className="px-4 text-ink-soft">{rule.resolutionHours}h</TableCell>
                  <TableCell className="px-4">
                    <button
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      disabled={toggleMutation.isPending}
                      className="cursor-pointer outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Badge variant={rule.isActive ? 'success' : 'neutral'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="px-4 text-mute">{format(new Date(rule.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(rule)} aria-label="Edit rule">
                        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-danger hover:bg-danger-tint hover:text-danger"
                        onClick={() => { setDeleteId(rule.id); setDeleteOpen(true); }}
                        aria-label="Delete rule"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogTitle className="mb-4">{editingRule ? 'Edit SLA Rule' : 'Create SLA Rule'}</DialogTitle>
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Critical SLA" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>First Response (hours)</Label>
                <Input type="number" min={0.1} step={0.1} value={form.firstResponseHours} onChange={(e) => setForm({ ...form, firstResponseHours: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Resolution (hours)</Label>
                <Input type="number" min={0.1} step={0.1} value={form.resolutionHours} onChange={(e) => setForm({ ...form, resolutionHours: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Priority filter</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: (v as string) ?? '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
              <Checkbox checked={form.isActive} onCheckedChange={(checked: boolean) => setForm({ ...form, isActive: checked })} />
              Active
            </label>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle className="mb-4">Delete SLA Rule</DialogTitle>
          <div className="flex flex-col gap-[18px]">
            <p className="text-[13px] leading-relaxed text-mute">
              Are you sure you want to delete this SLA rule? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
