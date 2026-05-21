'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { sileo } from 'sileo';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Search01Icon, PencilEdit01Icon, Delete01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { format } from 'date-fns';
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Badge,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
} from '@/components/ui';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  _count?: { createdTickets: number; assignedTickets: number; comments: number };
  createdAt: string;
}

type ApiListResponse<T> = { data: T; meta: { total: number; totalPages: number } };

const roleBadgeVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'warning',
  AGENT: 'info',
  CUSTOMER: 'success',
};

function RoleBadge({ role }: { role: string }) {
  const label = role === 'SUPER_ADMIN' ? 'Super Admin' : role.charAt(0) + role.slice(1).toLowerCase();
  return <Badge variant={roleBadgeVariant[role] ?? 'neutral'}>{label}</Badge>;
}

function FieldSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Select value={value || ''} onValueChange={(v) => onChange((v as string) ?? '')} items={options}>
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

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5 backdrop-blur-[2px]">
      <div onClick={(e) => e.stopPropagation()} className="w-[min(520px,100%)] overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-ink">{title}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </Button>
        </div>
        <div className="p-6">{children}</div>
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
      sileo.success({ title: 'User created' });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'AGENT' });
    },
    onError: () => sileo.error({ title: 'Failed to create user' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: typeof editForm }) =>
      apiClient(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      sileo.success({ title: 'User updated' });
      setEditOpen(false);
      setEditUser(null);
    },
    onError: () => sileo.error({ title: 'Failed to update user' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      sileo.success({ title: 'User deactivated' });
    },
    onError: () => sileo.error({ title: 'Failed to deactivate user' }),
  });

  const users = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    setEditOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <p className="text-sm font-medium text-danger">Failed to load users</p>
        <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-ink">Users</h2>
          <p className="mt-0.5 text-xs text-mute">{data?.meta?.total || 0} total</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} size={13} />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} size={14} color="var(--mute)" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <div className="w-[150px]">
          <FieldSelect value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} placeholder="All roles" options={roleOptions} />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {['Name', 'Email', 'Role', 'Status', 'Tickets', 'Created', 'Actions'].map((h) => (
                <TableHead key={h} className="bg-surface-2">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <Skeleton height={20} />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-10 text-center text-mute">No users found</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-ink">{user.name}</TableCell>
                  <TableCell className="text-mute">{user.email}</TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'neutral'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-mute">{(user._count?.createdTickets ?? 0) + (user._count?.assignedTickets ?? 0)}</TableCell>
                  <TableCell className="text-mute">{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)} aria-label="Edit user">
                        <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-mute hover:text-danger"
                          onClick={() => { if (window.confirm('Deactivate this user?')) deleteMutation.mutate(user.id); }}
                          aria-label="Deactivate user"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={13} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-xs text-mute">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create User">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <Label>Name</Label>
            <Input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Email</Label>
            <Input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Password</Label>
            <Input required type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Role</Label>
            <FieldSelect value={createForm.role} onChange={(v) => setCreateForm({ ...createForm, role: v })} options={roleOptions} />
          </div>
          <Button variant="primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create User'}
          </Button>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit User">
        {editUser && (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editUser.id, body: editForm }); }} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Email</Label>
              <Input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Role</Label>
              <FieldSelect value={editForm.role} onChange={(v) => setEditForm({ ...editForm, role: v })} options={roleOptions} />
            </div>
            <Label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
              <Checkbox checked={editForm.isActive} onCheckedChange={(checked: boolean) => setEditForm({ ...editForm, isActive: checked === true })} />
              Active
            </Label>
            <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
