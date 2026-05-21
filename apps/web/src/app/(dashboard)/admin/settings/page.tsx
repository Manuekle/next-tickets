'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { UserGroupIcon, Ticket01Icon, BubbleChatIcon, Activity01Icon } from '@hugeicons/core-free-icons';
import { Card, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface SystemStats {
  totalUsers: number;
  totalTickets: number;
  totalComments: number;
  activeSessions: number;
  usersByRole: { role: string; count: number }[];
}

function StatCard({ title, value, icon, loading, tint }: { title: string; value?: number; icon: IconSvgElement; loading: boolean; tint: string }) {
  return (
    <Card hover className="p-[18px]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tint)}>
          <HugeiconsIcon icon={icon} size={16} />
        </span>
        <span className="text-xs font-medium text-mute">{title}</span>
      </div>
      {loading ? (
        <Skeleton width={80} height={28} />
      ) : (
        <p className="text-[26px] font-bold leading-none -tracking-[0.02em] tabular-nums text-ink">{value ?? 0}</p>
      )}
    </Card>
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
      <div className="flex items-center justify-center py-16 text-sm text-danger">
        Failed to load system stats
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-ink">Settings</h2>
        <p className="mt-0.5 text-xs text-mute">System information and configuration</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        <StatCard title="Total Users"    value={stats?.totalUsers}    icon={UserGroupIcon}  loading={isLoading} tint="bg-cat-blue-tint text-cat-blue" />
        <StatCard title="Total Tickets"  value={stats?.totalTickets}  icon={Ticket01Icon}   loading={isLoading} tint="bg-cat-purple-tint text-cat-purple" />
        <StatCard title="Total Comments" value={stats?.totalComments} icon={BubbleChatIcon} loading={isLoading} tint="bg-cat-amber-tint text-cat-amber" />
        <StatCard title="Active Sessions" value={stats?.activeSessions} icon={Activity01Icon} loading={isLoading} tint="bg-cat-green-tint text-cat-green" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-[18px] py-3.5">
          <span className="text-[13px] font-semibold text-ink">Users by Role</span>
        </div>
        <div className="p-[18px]">
          {isLoading ? (
            <Skeleton height={120} radius={8} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {stats?.usersByRole.map((r) => (
                <div key={r.role} className="flex items-center justify-between text-[13px]">
                  <span className="capitalize text-ink-soft">
                    {r.role === 'SUPER_ADMIN' ? 'Super Admin' : r.role.toLowerCase()}
                  </span>
                  <span className="font-semibold text-ink">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
