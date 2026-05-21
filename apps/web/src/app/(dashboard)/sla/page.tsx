'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { DashboardSpeed01Icon, Alert02Icon, CheckmarkCircle01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SlaMetrics {
  totalTickets: number;
  breachedCount: number;
  withinSlaCount: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  byPriority: { priority: string; total: number; breached: number }[];
}

const PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'warning', CRITICAL: 'danger',
};

function CardHead({ title }: { title: string }) {
  return (
    <div className="border-b border-hairline px-5 py-3.5">
      <h3>{title}</h3>
    </div>
  );
}

function StatCard({ title, value, icon, loading, danger }: {
  title: string; value?: number | string; icon: IconSvgElement; loading: boolean; danger?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-mute">{title}</div>
        <HugeiconsIcon icon={icon} size={15} className={danger ? 'text-danger' : 'text-mute'} />
      </div>
      {loading ? (
        <Skeleton width={60} height={32} radius={8} />
      ) : (
        <div
          className={cn(
            'font-display text-[30px] font-normal leading-none -tracking-[0.03em] tabular-nums',
            danger ? 'text-danger' : 'text-ink',
          )}
        >
          {value ?? 0}
        </div>
      )}
    </Card>
  );
}

export default function SlaPage() {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['sla-metrics'],
    queryFn:  () => apiClient<SlaMetrics>('/sla/metrics'),
  });

  const breachMutation = useMutation({
    mutationFn: () => apiClient<{ breached: number }>('/sla/check-breaches', { method: 'POST' }),
    onSuccess:  (res) => {
      sileo.success({ title: `Checked breaches: ${res.breached} found` });
      queryClient.invalidateQueries({ queryKey: ['sla-metrics'] });
    },
    onError: () => sileo.error({ title: 'Failed to check breaches' }),
  });

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center text-[13px] text-danger">
        Failed to load SLA metrics
      </div>
    );
  }

  const pct = metrics?.slaComplianceRate ?? 0;
  const R = 52, C = 2 * Math.PI * R;
  const strokeColor = pct >= 90 ? 'var(--success)' : pct >= 75 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="flex flex-col gap-6">
      {/* Page head */}
      <div className="flex items-start justify-between">
        <div>
          <h1>SLA Dashboard</h1>
          <p className="mt-1.5 text-[13px] text-mute">
            Service Level Agreement metrics and compliance
          </p>
        </div>
        <Button variant="secondary" onClick={() => breachMutation.mutate()} disabled={breachMutation.isPending}>
          <HugeiconsIcon icon={Alert02Icon} size={14} />
          Check Breaches
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard title="Compliance Rate" value={metrics ? `${metrics.slaComplianceRate}%` : undefined} icon={CheckmarkCircle01Icon} loading={isLoading} />
        <StatCard title="Active SLAs"     value={metrics?.totalTickets}   icon={DashboardSpeed01Icon}   loading={isLoading} />
        <StatCard title="Breached"         value={metrics?.breachedCount}  icon={Alert02Icon}            loading={isLoading} danger />
        <StatCard title="Avg Resolution"   value={metrics ? `${metrics.avgResolutionTime}h` : undefined} icon={Clock01Icon} loading={isLoading} />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Compliance ring */}
        <Card className="overflow-hidden">
          <CardHead title="Compliance Overview" />
          <div className="flex flex-col items-center gap-3.5 p-6">
            {isLoading ? (
              <Skeleton width={112} height={112} radius={999} />
            ) : (
              <>
                <div className="relative h-28 w-28">
                  <svg width="112" height="112" viewBox="0 0 120 120" className="-rotate-90">
                    <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r={R}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - pct / 100)}
                      className="transition-[stroke-dashoffset] duration-[600ms] ease-in-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-[22px] -tracking-[0.03em] text-ink">
                      {pct}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-mute">
                  {metrics?.withinSlaCount ?? 0} of {metrics?.totalTickets ?? 0} within SLA
                </p>
              </>
            )}
          </div>
        </Card>

        {/* By priority */}
        <Card className="overflow-hidden">
          <CardHead title="By Priority" />
          <div className="flex flex-col gap-3 p-5">
            {isLoading ? (
              [1,2,3,4].map((i) => (
                <Skeleton key={i} height={28} radius={8} />
              ))
            ) : (
              <>
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-mute">
                  <span>Priority</span>
                  <span>Total / Breached</span>
                </div>
                {(metrics?.byPriority ?? []).map((p) => (
                  <div key={p.priority} className="flex items-center justify-between">
                    <Badge variant={PRIORITY_VARIANT[p.priority] ?? 'neutral'}>{p.priority}</Badge>
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="font-medium tabular-nums text-ink">{p.total}</span>
                      <span className="text-mute">/</span>
                      <span className={cn('tabular-nums', p.breached > 0 ? 'font-semibold text-danger' : 'text-mute')}>
                        {p.breached}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
