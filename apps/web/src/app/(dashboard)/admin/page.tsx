'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Input, Chip, Skeleton, useOverlayState, TextField, Label } from '@heroui/react';
import { Modal, ModalDialog, ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger } from '@heroui/react';
import { Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem } from '@heroui/react';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Key } from 'react-aria-components';

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

const roleColors: Record<string, string> = {
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
    queryFn: () =>
      apiClient<ApiListResponse<AdminUser[]>>('/admin/users', { params }),
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
    mutationFn: (id: string) =>
      apiClient(`/admin/users/${id}`, { method: 'DELETE' }),
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
        <p className="text-destructive font-medium">Failed to load users</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
        <Button variant="secondary" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            {data?.meta?.total || 0} total users
          </p>
        </div>
        <Button onClick={createState.open}>
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select onSelectionChange={(keys) => { setRoleFilter(String(keys) || ''); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              <ListBoxItem id=" ">All</ListBoxItem>
              <ListBoxItem id="ADMIN">Admin</ListBoxItem>
              <ListBoxItem id="AGENT">Agent</ListBoxItem>
              <ListBoxItem id="CUSTOMER">Customer</ListBoxItem>
            </ListBox>
          </SelectPopover>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Tickets</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full rounded-lg" /></td>
                  </tr>
                ))
              : users.length === 0
                ? (
                  <tr className="border-b last:border-0">
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )
                : users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <Chip color={roleColors[user.role] as any} variant="soft" size="sm">
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                      </Chip>
                    </td>
                    <td className="px-4 py-3">
                      <Chip color={user.isActive ? 'success' : 'default'} variant="soft" size="sm">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.ticketCount ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" isIconOnly size="sm" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            isIconOnly
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to deactivate this user?')) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" isDisabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" isDisabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
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
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-4"
            >
              <TextField isRequired>
              <Label>Name</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </TextField>
            <TextField isRequired>
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </TextField>
            <TextField isRequired>
              <Label>Password</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            </TextField>
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
              <Button type="submit" isDisabled={createMutation.isPending}>Create</Button>
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
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate({ id: editUser.id, body: editForm });
                }}
                className="space-y-4"
              >
                <TextField isRequired>
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </TextField>
                <TextField isRequired>
                  <Label>Email</Label>
                  <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </TextField>
                <Select
                  selectedKey={editForm.role}
                  onSelectionChange={(keys) => setEditForm({ ...editForm, role: String(keys) || 'AGENT' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectPopover>
                    <ListBox>
                      <ListBoxItem id="ADMIN">Admin</ListBoxItem>
                      <ListBoxItem id="AGENT">Agent</ListBoxItem>
                      <ListBoxItem id="CUSTOMER">Customer</ListBoxItem>
                    </ListBox>
                  </SelectPopover>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Active
                </label>
                <Button type="submit" isDisabled={updateMutation.isPending}>Save</Button>
              </form>
            )}
          </ModalBody>
        </ModalDialog>
      </Modal>
    </div>
  );
}
