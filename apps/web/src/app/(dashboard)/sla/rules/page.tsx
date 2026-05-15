'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
      setModalOpen(false);
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>First Response</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No SLA rules found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    {rule.priority ? (
                      <Badge variant="secondary">{rule.priority}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">All</span>
                    )}
                  </TableCell>
                  <TableCell>{rule.firstResponseHours}h</TableCell>
                  <TableCell>{rule.resolutionHours}h</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="xs"
                      className={rule.isActive ? 'text-green-500' : 'text-muted-foreground'}
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      loading={toggleMutation.isPending}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(rule.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditingRule(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit SLA Rule' : 'Create SLA Rule'}</DialogTitle>
            <DialogDescription>
              {editingRule ? 'Update the SLA rule details below.' : 'Define a new SLA rule for tickets.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Critical SLA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstResponse">First Response (hours)</Label>
                <Input id="firstResponse" type="number" min={0.1} step={0.1} value={form.firstResponseHours} onChange={(e) => setForm({ ...form, firstResponseHours: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution (hours)</Label>
                <Input id="resolution" type="number" min={0.1} step={0.1} value={form.resolutionHours} onChange={(e) => setForm({ ...form, resolutionHours: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.priority || undefined} onValueChange={(v) => setForm({ ...form, priority: v ?? '' })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave} loading={saveMutation.isPending}>
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SLA Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this SLA rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
