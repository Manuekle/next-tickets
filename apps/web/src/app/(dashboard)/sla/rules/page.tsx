'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, PencilEdit01Icon, Delete01Icon, Cancel01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px', color: 'var(--ink)',
  border: 0, borderRadius: '8px', background: 'var(--surface)',
  boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

const priorityColors: Record<string, React.CSSProperties> = {
  LOW:      { background: 'oklch(0.94 0.06 148)', color: 'oklch(0.42 0.16 148)' },
  MEDIUM:   { background: 'oklch(0.96 0.06 60)',  color: 'oklch(0.50 0.18 60)'  },
  HIGH:     { background: 'oklch(0.95 0.08 40)',  color: 'oklch(0.52 0.22 40)'  },
  CRITICAL: { background: 'oklch(0.95 0.04 22)',  color: 'oklch(0.50 0.20 22)'  },
};

function NativeSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <HugeiconsIcon icon={ArrowDown01Icon} size={12} color="var(--mute)" style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,18,30,0.32)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'hx-fade 140ms ease-out' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)', background: 'var(--surface)', borderRadius: '18px', boxShadow: '0 24px 60px -20px rgba(15,18,30,0.30), 0 4px 12px rgba(15,18,30,0.08)', overflow: 'hidden', animation: 'hx-pop 200ms cubic-bezier(0.2,0.8,0.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</span>
          <button onClick={onClose} style={{ width: '26px', height: '26px', border: 0, borderRadius: '7px', background: 'var(--surface-2)', color: 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </button>
        </div>
        <div style={{ padding: '22px' }}>{children}</div>
      </div>
    </div>
  );
}

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
      toast.success(editingRule ? 'Rule updated' : 'Rule created');
    },
    onError: () => toast.error('Failed to save rule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/sla/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      setDeleteId(null);
      setDeleteOpen(false);
      toast.success('Rule deleted');
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/sla/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sla-rules'] }),
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

  const formGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '14px' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '4px', display: 'block' };
  const btnPrimary: React.CSSProperties = { padding: '9px 18px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px -4px var(--accent-glow)' };
  const btnSecondary: React.CSSProperties = { padding: '7px 14px', fontSize: '12px', fontWeight: 500, border: 0, borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' };
  const btnDanger: React.CSSProperties = { padding: '9px 18px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px', background: 'oklch(0.50 0.20 22)', color: '#fff', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>SLA Rules</h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>Manage Service Level Agreement rules</p>
        </div>
        <button style={btnPrimary} onClick={openCreate}>
          <HugeiconsIcon icon={Add01Icon} size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
          Create Rule
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Priority', 'First Response', 'Resolution', 'Status', 'Created', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td colSpan={7} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', borderRadius: '6px', background: 'var(--surface-2)' }} />
                  </td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--mute)' }}>No SLA rules found</td>
              </tr>
            ) : (
              data?.data.map((rule) => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--hairline)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--ink)' }}>{rule.name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {rule.priority ? (
                      <span style={{ ...(priorityColors[rule.priority] ?? { background: 'var(--surface-2)', color: 'var(--mute)' }), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {rule.priority}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--mute)', fontSize: '12px' }}>All</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--ink-soft)' }}>{rule.firstResponseHours}h</td>
                  <td style={{ padding: '10px 16px', color: 'var(--ink-soft)' }}>{rule.resolutionHours}h</td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      disabled={toggleMutation.isPending}
                      style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 0, cursor: 'pointer', background: rule.isActive ? 'oklch(0.94 0.06 148)' : 'var(--surface-2)', color: rule.isActive ? 'oklch(0.42 0.16 148)' : 'var(--mute)' }}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--mute)' }}>{format(new Date(rule.createdAt), 'MMM d, yyyy')}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => openEdit(rule)}
                        style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                      </button>
                      <button onClick={() => { setDeleteId(rule.id); setDeleteOpen(true); }}
                        style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'oklch(0.58 0.20 22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.96 0.04 22)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title={editingRule ? 'Edit SLA Rule' : 'Create SLA Rule'}>
        <div style={formGap}>
          <div>
            <label style={labelStyle}>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Critical SLA" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>First Response (hours)</label>
              <input type="number" min={0.1} step={0.1} value={form.firstResponseHours} onChange={(e) => setForm({ ...form, firstResponseHours: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Resolution (hours)</label>
              <input type="number" min={0.1} step={0.1} value={form.resolutionHours} onChange={(e) => setForm({ ...form, resolutionHours: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Priority filter</label>
            <NativeSelect
              value={form.priority}
              onChange={(v) => setForm({ ...form, priority: v })}
              placeholder="All priorities"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-soft)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          <button onClick={handleSave} disabled={saveMutation.isPending} style={{ ...btnPrimary, opacity: saveMutation.isPending ? 0.6 : 1 }}>
            {saveMutation.isPending ? 'Saving…' : editingRule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete SLA Rule">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ fontSize: '13px', color: 'var(--mute)', lineHeight: 1.6 }}>
            Are you sure you want to delete this SLA rule? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={btnSecondary} onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button style={{ ...btnDanger, opacity: deleteMutation.isPending ? 0.6 : 1 }} disabled={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
