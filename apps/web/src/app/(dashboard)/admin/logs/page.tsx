'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { format } from 'date-fns';
import {
  Button,
  Input,
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

const actionBadgeVariant: Record<string, 'success' | 'info' | 'danger' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  LOGIN: 'neutral',
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
    queryFn: () => apiClient<ApiListResponse<AuditLog[]>>('/admin/audit-logs', { params }),
  });

  const logs = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-danger">
        Failed to load audit logs
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-ink">Audit Logs</h2>
        <p className="mt-0.5 text-xs text-mute">{data?.meta?.total || 0} total entries</p>
      </div>

      <div className="relative max-w-[360px]">
        <HugeiconsIcon icon={Search01Icon} size={14} color="var(--mute)" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search actions…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-8"
        />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP'].map((h) => (
                <TableHead key={h} className="bg-surface-2">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Skeleton height={18} radius={5} />
                    </TableCell>
                  </TableRow>
                ))
              : logs.length === 0
                ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-10 text-center text-mute">No audit logs found</TableCell>
                  </TableRow>
                )
                : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-mute">{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-ink">{log.user?.name || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant={actionBadgeVariant[log.action] ?? 'neutral'}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="capitalize text-ink-soft">{log.entity}</TableCell>
                    <TableCell className="font-mono text-[11px] text-mute">{log.entityId}</TableCell>
                    <TableCell className="text-mute">{log.ip}</TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-xs text-mute">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
