'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user: { name: string; email: string } | null;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  createdAt: string;
}

type ApiListResponse<T> = { data: T; meta: { total: number; totalPages: number } };

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-500',
  UPDATE: 'bg-blue-500/10 text-blue-500',
  DELETE: 'bg-red-500/10 text-red-500',
  LOGIN: 'bg-purple-500/10 text-purple-500',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params: Record<string, string> = {};
  if (search) params.q = search;
  params.page = String(page);
  params.limit = '20';

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () =>
      apiClient<ApiListResponse<AuditLog[]>>('/admin/audit-logs', { params }),
  });

  const logs = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive">
        Failed to load audit logs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">
          {data?.meta?.total || 0} total entries
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search actions..."
          className="pl-9 max-w-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              : logs.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )
                : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">{log.user?.name || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={actionColors[log.action] || ''}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{log.entity}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{log.entityId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ip}</TableCell>
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
    </div>
  );
}
