'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Input, Chip, Skeleton, TextField, Label, useOverlayState } from '@heroui/react';
import { Modal, ModalDialog, ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger } from '@heroui/react';
import { Select, SelectTrigger, SelectValue, SelectPopover } from '@heroui/react';
import { ListBox, ListBoxItem } from '@heroui/react';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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

const roleColors: Record<string, 'danger' | 'warning' | 'accent' | 'success'> = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'warning',
  AGENT: 'accent',
  CUSTOMER: 'success',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const createState = useOverlayState();
  const editState = useOverlayState();
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
      createState.close();
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
      editState.close();
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
    editState.open();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-medium text-[#DE350B]">Failed to load users</p>
        <p className="text-sm text-[#6B778C] mt-1">Please try again later.</p>
        <Button variant="secondary" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#172B4D]">Users</h1>
          <p className="text-sm text-[#6B778C]">{data?.meta?.total || 0} total</p>
        </div>
        <Button variant="primary" size="sm" onClick={createState.open}>
          <Plus className="h-4 w-4" />
          <span className="ml-1.5">Create User</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B778C] z-10" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select aria-label="Filter by role" onSelectionChange={(keys) => { setRoleFilter(String(keys) || ''); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id=" ">All roles</ListBoxItem>
              <ListBoxItem id="ADMIN">Admin</ListBoxItem>
              <ListBoxItem id="AGENT">Agent</ListBoxItem>
              <ListBoxItem id="CUSTOMER">Customer</ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
      </div>

      <div className="rounded-sm border border-[#DFE1E6] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DFE1E6] bg-[#f4f5f7]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Role</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Tickets</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Created</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#DFE1E6] last:border-0">
                  <td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full rounded-sm" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr className="border-b border-[#DFE1E6] last:border-0">
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6B778C]">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[#DFE1E6] last:border-0 hover:bg-[#f4f5f7]">
                  <td className="px-4 py-3 font-medium text-[#172B4D]">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-[#6B778C]">{user.email}</td>
                  <td className="px-4 py-3">
                    <Chip color={roleColors[user.role] as any} variant="soft" size="sm" className="text-xs">
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <Chip color={user.isActive ? 'success' : 'default'} variant="soft" size="sm" className="text-xs">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B778C]">{user.ticketCount ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-[#6B778C]">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" isIconOnly size="sm" onClick={() => handleEdit(user)}><Pencil className="h-4 w-4" /></Button>
                      {isSuperAdmin && (
                        <Button variant="ghost" isIconOnly size="sm" onClick={() => { if (window.confirm('Deactivate this user?')) deleteMutation.mutate(user.id); }}>
                          <Trash2 className="h-4 w-4 text-[#DE350B]" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" isDisabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-[#6B778C]">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" isDisabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Modal state={createState}>
        <ModalDialog>
          <ModalCloseTrigger />
          <ModalHeader>
            <ModalHeading>Create User</ModalHeading>
          </ModalHeader>
          <ModalBody>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createForm); }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#172B4D]">Name</Label>
                <TextField isRequired isInvalid={false}>
                  <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                </TextField>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#172B4D]">Email</Label>
                <TextField isRequired>
                  <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                </TextField>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#172B4D]">Password</Label>
                <TextField isRequired>
                  <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                </TextField>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-[#172B4D]">Role</Label>
                <Select onSelectionChange={(keys) => setCreateForm({ ...createForm, role: String(keys) || 'AGENT' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectPopover>
                    <ListBox>
                      <ListBoxItem id="ADMIN">Admin</ListBoxItem>
                      <ListBoxItem id="AGENT">Agent</ListBoxItem>
                      <ListBoxItem id="CUSTOMER">Customer</ListBoxItem>
                    </ListBox>
                  </SelectPopover>
                </Select>
              </div>
              <Button type="submit" variant="primary" isDisabled={createMutation.isPending}>Create</Button>
            </form>
          </ModalBody>
        </ModalDialog>
      </Modal>

      <Modal state={editState}>
        <ModalDialog>
          <ModalCloseTrigger />
          <ModalHeader>
            <ModalHeading>Edit User</ModalHeading>
          </ModalHeader>
          <ModalBody>
            {editUser && (
              <form
                onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editUser.id, body: editForm }); }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#172B4D]">Name</Label>
                  <TextField isRequired>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </TextField>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#172B4D]">Email</Label>
                  <TextField isRequired>
                    <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </TextField>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-[#172B4D]">Role</Label>
                  <Select selectedKey={editForm.role} onSelectionChange={(keys) => setEditForm({ ...editForm, role: String(keys) || 'AGENT' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectPopover>
                      <ListBox>
                        <ListBoxItem id="ADMIN">Admin</ListBoxItem>
                        <ListBoxItem id="AGENT">Agent</ListBoxItem>
                        <ListBoxItem id="CUSTOMER">Customer</ListBoxItem>
                      </ListBox>
                    </SelectPopover>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} className="h-4 w-4" />
                  <span className="text-[#172B4D]">Active</span>
                </label>
                <Button type="submit" variant="primary" isDisabled={updateMutation.isPending}>Save</Button>
              </form>
            )}
          </ModalBody>
        </ModalDialog>
      </Modal>
    </div>
  );
}
