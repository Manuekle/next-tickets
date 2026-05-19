'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Search01Icon, PencilEdit01Icon, Delete01Icon, Cancel01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { format } from 'date-fns';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  ticketCount?: number;
  createdAt: string;
}

type ApiListResponse<T> = { data: T; meta: { total: number; totalPages: number } };

const roleBadgeStyle: Record<string, React.CSSProperties> = {
  SUPER_ADMIN: { background: 'oklch(0.95 0.04 22)',  color: 'oklch(0.50 0.20 22)' },
  ADMIN:       { background: 'oklch(0.96 0.06 60)',  color: 'oklch(0.50 0.18 60)' },
  AGENT:       { background: 'var(--accent-tint)',   color: 'var(--accent)'       },
  CUSTOMER:    { background: 'oklch(0.94 0.06 148)', color: 'oklch(0.42 0.16 148)' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px', color: 'var(--ink)',
  border: 0, borderRadius: '8px', background: 'var(--surface)',
  boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

function RoleBadge({ role }: { role: string }) {
  const label = role === 'SUPER_ADMIN' ? 'Super Admin' : role.charAt(0) + role.slice(1).toLowerCase();
  return (
    <span style={{ ...(roleBadgeStyle[role] ?? { background: 'var(--surface-2)', color: 'var(--mute)' }), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
      {label}
    </span>
  );
}

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

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'CUSTOMER', label: 'Customer' },
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'AGENT' });
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', isActive: true });

  const params: Record<string, string> = {};
  if (search) params.q = search;
  if (roleFilter) params.role = roleFilter;
  params.page = String(page);
  params.limit = '20';

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => apiClient<ApiListResponse<AdminUser[]>>('/admin/users', { params }),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof createForm) =>
      apiClient('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created');
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'AGENT' });
    },
    onError: () => toast.error('Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: typeof editForm }) =>
      apiClient(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
      setEditOpen(false);
      setEditUser(null);
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deactivated');
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const users = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    setEditOpen(true);
  };

  const formGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '14px' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '4px', display: 'block' };
  const btnPrimary: React.CSSProperties = { padding: '9px 18px', fontSize: '13px', fontWeight: 600, border: 0, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px -4px var(--accent-glow)', transition: 'opacity 100ms' };
  const btnSecondary: React.CSSProperties = { padding: '7px 14px', fontSize: '12px', fontWeight: 500, border: 0, borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: '8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'oklch(0.50 0.20 22)' }}>Failed to load users</p>
        <button style={btnSecondary} onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0 }}>Users</h2>
          <p style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '3px' }}>{data?.meta?.total || 0} total</p>
        </div>
        <button style={btnPrimary} onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <HugeiconsIcon icon={Search01Icon} size={14} color="var(--mute)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: '32px' }}
          />
        </div>
        <div style={{ width: '150px' }}>
          <NativeSelect value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} placeholder="All roles" options={roleOptions} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Email', 'Role', 'Status', 'Tickets', 'Created', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td colSpan={7} style={{ padding: '12px 16px' }}>
                    <div style={{ height: '20px', borderRadius: '6px', background: 'var(--surface-2)' }} />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--mute)' }}>No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--hairline)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--ink)' }}>{user.name}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--mute)' }}>{user.email}</td>
                  <td style={{ padding: '10px 16px' }}><RoleBadge role={user.role} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: user.isActive ? 'oklch(0.94 0.06 148)' : 'var(--surface-2)', color: user.isActive ? 'oklch(0.42 0.16 148)' : 'var(--mute)' }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--mute)' }}>{user.ticketCount ?? 0}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--mute)' }}>{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleEdit(user)}
                        style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'var(--mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => { if (window.confirm('Deactivate this user?')) deleteMutation.mutate(user.id); }}
                          style={{ width: '28px', height: '28px', border: 0, borderRadius: '7px', background: 'transparent', color: 'oklch(0.58 0.20 22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.96 0.04 22)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <button style={btnSecondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Page {page} of {totalPages}</span>
          <button style={btnSecondary} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create User">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }} style={formGap}>
          <div>
            <label style={labelStyle}>Name</label>
            <input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input required type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <NativeSelect value={createForm.role} onChange={(v) => setCreateForm({ ...createForm, role: v })} options={roleOptions} />
          </div>
          <button type="submit" disabled={createMutation.isPending} style={{ ...btnPrimary, opacity: createMutation.isPending ? 0.6 : 1 }}>
            {createMutation.isPending ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit User">
        {editUser && (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editUser.id, body: editForm }); }} style={formGap}>
            <div>
              <label style={labelStyle}>Name</label>
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <NativeSelect value={editForm.role} onChange={(v) => setEditForm({ ...editForm, role: v })} options={roleOptions} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-soft)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
              Active
            </label>
            <button type="submit" disabled={updateMutation.isPending} style={{ ...btnPrimary, opacity: updateMutation.isPending ? 0.6 : 1 }}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
