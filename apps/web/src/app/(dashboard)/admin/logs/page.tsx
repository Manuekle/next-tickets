'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
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

const actionBadge: Record<string, React.CSSProperties> = {
  CREATE: { background: 'oklch(0.94 0.06 148)', color: 'oklch(0.42 0.16 148)' },
  UPDATE: { background: 'var(--accent-tint)', color: 'var(--accent)' },
  DELETE: { background: 'oklch(0.95 0.04 22)', color: 'oklch(0.50 0.20 22)' },
  LOGIN:  { background: 'var(--surface-2)', color: 'var(--mute)' },
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px 8px 32px', fontSize: '13px', color: 'var(--ink)',
    border: 0, borderRadius: '8px', background: 'var(--surface)',
    boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
    outline: 'none', fontFamily: 'inherit',
  };
  const btnSecondary: React.CSSProperties = {
    padding: '7px 14px', fontSize: '12px', fontWeight: 500, border: 0, borderRadius: '8px',
    background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'oklch(0.50 0.20 22)', fontSize: '14px' }}>
        Failed to load audit logs
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0 }}>Audit Logs</h2>
        <p style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '3px' }}>{data?.meta?.total || 0} total entries</p>
      </div>

      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)', pointerEvents: 'none' }} />
        <input
          placeholder="Search actions…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={inputStyle}
        />
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <td colSpan={6} style={{ padding: '12px 16px' }}>
                      <div style={{ height: '18px', borderRadius: '5px', background: 'var(--surface-2)' }} />
                    </td>
                  </tr>
                ))
              : logs.length === 0
                ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--mute)' }}>No audit logs found</td>
                  </tr>
                )
                : logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--hairline)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 16px', color: 'var(--mute)' }}>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--ink)' }}>{log.user?.name || 'System'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ ...(actionBadge[log.action] ?? { background: 'var(--surface-2)', color: 'var(--mute)' }), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{log.entity}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>{log.entityId}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--mute)' }}>{log.ip}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <button style={btnSecondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Page {page} of {totalPages}</span>
          <button style={btnSecondary} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
