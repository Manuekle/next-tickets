'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button, Input, Chip, Skeleton } from '@heroui/react';
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
  CREATE: 'success',
  UPDATE: 'accent',
  DELETE: 'danger',
  LOGIN: 'secondary',
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
        <Input
          placeholder="Search actions..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Entity</th>
              <th className="px-4 py-3 text-left font-medium">Entity ID</th>
              <th className="px-4 py-3 text-left font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full rounded-lg" /></td>
                  </tr>
                ))
              : logs.length === 0
                ? (
                  <tr className="border-b last:border-0">
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No audit logs found
                    </td>
                  </tr>
                )
                : logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm">{log.user?.name || 'System'}</td>
                    <td className="px-4 py-3">
                      <Chip color={(actionColors[log.action] || 'default') as any} variant="soft" size="sm">
                        {log.action}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{log.entity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{log.entityId}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.ip}</td>
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
    </div>
  );
}
