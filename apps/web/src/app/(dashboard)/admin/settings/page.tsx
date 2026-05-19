'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { UserGroupIcon, Ticket01Icon, BubbleChatIcon, Activity01Icon } from '@hugeicons/core-free-icons';

interface SystemStats {
  totalUsers: number;
  totalTickets: number;
  totalComments: number;
  activeSessions: number;
  usersByRole: { role: string; count: number }[];
}

function StatCard({ title, value, icon, loading }: { title: string; value?: number; icon: IconSvgElement; loading: boolean }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-md)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mute)' }}>{title}</span>
        <HugeiconsIcon icon={icon} size={16} color="var(--mute)" />
      </div>
      {loading ? (
        <div style={{ height: '28px', width: '80px', borderRadius: '6px', background: 'var(--surface-2)' }} />
      ) : (
        <p style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>{value ?? 0}</p>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient<{ data: SystemStats }>('/admin/stats'),
  });

  const stats = data?.data;

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'oklch(0.50 0.20 22)', fontSize: '14px' }}>
        Failed to load system stats
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0 }}>Settings</h2>
        <p style={{ fontSize: '12px', color: 'var(--mute)', marginTop: '3px' }}>System information and configuration</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        <StatCard title="Total Users"    value={stats?.totalUsers}    icon={UserGroupIcon}  loading={isLoading} />
        <StatCard title="Total Tickets"  value={stats?.totalTickets}  icon={Ticket01Icon}   loading={isLoading} />
        <StatCard title="Total Comments" value={stats?.totalComments} icon={BubbleChatIcon} loading={isLoading} />
        <StatCard title="Active Sessions" value={stats?.activeSessions} icon={Activity01Icon} loading={isLoading} />
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Users by Role</span>
        </div>
        <div style={{ padding: '18px' }}>
          {isLoading ? (
            <div style={{ height: '120px', borderRadius: '8px', background: 'var(--surface-2)' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats?.usersByRole.map((r) => (
                <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
                    {r.role === 'SUPER_ADMIN' ? 'Super Admin' : r.role.toLowerCase()}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
