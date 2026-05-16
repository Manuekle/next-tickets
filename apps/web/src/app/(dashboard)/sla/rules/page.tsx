'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

import { Button, Input, TextArea, Chip, Skeleton, useOverlayState, TextField, Label, FieldError } from '@heroui/react';


import { Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem } from '@heroui/react';


import { Modal, ModalDialog, ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger } from '@heroui/react';

import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Key } from 'react-aria-components';

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

export default function SlaRulesPage() {
  const queryClient = useQueryClient();
  const modalState = useOverlayState();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteModalState = useOverlayState();
  const [editingRule, setEditingRule] = useState<SlaRule | null>(null);
  const [form, setForm] = useState<SlaForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['sla-rules'],
    queryFn: () => apiClient<{ data: SlaRule[] }>('/sla'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; body: Partial<SlaForm> }) =>
      data.id
        ? apiClient(`/sla/${data.id}`, { method: 'PATCH', body: JSON.stringify(data.body) })
        : apiClient('/sla', { method: 'POST', body: JSON.stringify(data.body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      modalState.close();
      setEditingRule(null);
      setForm(defaultForm);
      toast.success(editingRule ? 'Rule updated' : 'Rule created');
    },
    onError: () => toast.error('Failed to save rule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/sla/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      setDeleteId(null);
      deleteModalState.close();
      toast.success('Rule deleted');
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/sla/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
    },
    onError: () => toast.error('Failed to toggle rule'),
  });

  function openCreate() {
    setEditingRule(null);
    setForm(defaultForm);
    modalState.open();
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
    modalState.open();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SLA Rules</h1>
          <p className="text-sm text-muted-foreground">Manage Service Level Agreement rules</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Rule
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">First Response</th>
              <th className="px-4 py-3 text-left font-medium">Resolution</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full rounded-lg" /></td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr className="border-b last:border-0">
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No SLA rules found
                </td>
              </tr>
            ) : (
              data?.data.map((rule) => (
                <tr key={rule.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{rule.name}</td>
                  <td className="px-4 py-3">
                    {rule.priority ? (
                      <Chip variant="soft" size="sm">{rule.priority}</Chip>
                    ) : (
                      <span className="text-sm text-muted-foreground">All</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{rule.firstResponseHours}h</td>
                  <td className="px-4 py-3">{rule.resolutionHours}h</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={rule.isActive ? 'text-green-500' : 'text-muted-foreground'}
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      isDisabled={toggleMutation.isPending}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {format(new Date(rule.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" isIconOnly size="sm" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" isIconOnly size="sm" onClick={() => { setDeleteId(rule.id); deleteModalState.open(); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal state={modalState}>
        <ModalDialog>
          <ModalCloseTrigger />
          <ModalHeader>
            <ModalHeading>{editingRule ? 'Edit SLA Rule' : 'Create SLA Rule'}</ModalHeading>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <TextField>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Critical SLA" />
            </TextField>
            <TextField>
              <Label>Description</Label>
              <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </TextField>
            <div className="grid grid-cols-2 gap-4">
              <TextField>
                <Label>First Response (hours)</Label>
                <Input type="number" min={0.1} step={0.1} value={String(form.firstResponseHours)} onChange={(e) => setForm({ ...form, firstResponseHours: parseFloat(e.target.value) || 0 })} />
              </TextField>
              <TextField>
                <Label>Resolution (hours)</Label>
                <Input type="number" min={0.1} step={0.1} value={String(form.resolutionHours)} onChange={(e) => setForm({ ...form, resolutionHours: parseFloat(e.target.value) || 0 })} />
              </TextField>
            </div>
            <Select
              selectedKey={form.priority || null}
              onSelectionChange={(keys) => setForm({ ...form, priority: String(keys) || '' })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectPopover>
                <ListBox>
                  <ListBoxItem key="">All priorities</ListBoxItem>
                  <ListBoxItem key="LOW">Low</ListBoxItem>
                  <ListBoxItem key="MEDIUM">Medium</ListBoxItem>
                  <ListBoxItem key="HIGH">High</ListBoxItem>
                  <ListBoxItem key="CRITICAL">Critical</ListBoxItem>
                </ListBox>
              </SelectPopover>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              Active
            </label>
            <Button onClick={handleSave} isDisabled={saveMutation.isPending}>
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </ModalBody>
        </ModalDialog>
      </Modal>

      <Modal state={deleteModalState}>
        <ModalDialog>
          <ModalCloseTrigger />
          <ModalHeader>
            <ModalHeading>Delete SLA Rule</ModalHeading>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this SLA rule? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
             
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              isDisabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
    </div>
  );
}
