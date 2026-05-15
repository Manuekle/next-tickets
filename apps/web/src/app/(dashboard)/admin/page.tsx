'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/10 text-red-500',
  ADMIN: 'bg-orange-500/10 text-orange-500',
  AGENT: 'bg-blue-500/10 text-blue-500',
  CUSTOMER: 'bg-green-500/10 text-green-500',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'AGENT' });

  const [editOpen, setEditOpen] = useState(false);
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
    setEditOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive font-medium">Failed to load users</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
        <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}>
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
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => { setRoleFilter(v ?? ''); setPage(1); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              : users.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )
                : users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={roleColors[user.role]}>
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.ticketCount ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
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
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(createForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v || 'AGENT' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" loading={createMutation.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditUser(null); }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: editUser.id, body: editForm });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v || 'AGENT' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button type="submit" loading={updateMutation.isPending}>Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
