'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { DashboardSpeed01Icon, Alert02Icon, CheckmarkCircle01Icon, Clock01Icon } from '@hugeicons/core-free-icons';

interface SlaMetrics {
  totalTickets: number;
  breachedCount: number;
  withinSlaCount: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  byPriority: { priority: string; total: number; breached: number }[];
}

const PRIORITY_HUE: Record<string, number> = {
  LOW: 148, MEDIUM: 50, HIGH: 28, CRITICAL: 22,
};

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div style={{
      background:   'var(--surface)',
      borderRadius: '16px',
      boxShadow:    'var(--shadow-md)',
      overflow:     'hidden',
      padding:      padded ? '20px' : 0,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title }: { title: string }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</span>
    </div>
  );
}

function StatCard({ title, value, icon, loading, danger }: {
  title: string; value?: number | string; icon: IconSvgElement; loading: boolean; danger?: boolean;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{title}</div>
        <HugeiconsIcon icon={icon} size={15} color={danger ? 'oklch(0.50 0.20 22)' : 'var(--mute)'} />
      </div>
      {loading ? (
        <div style={{ height: '32px', width: '60px', background: 'var(--surface-2)', borderRadius: '8px' }} />
      ) : (
        <div style={{
          fontSize:      '30px',
          fontFamily:    'var(--font-display)',
          fontWeight:    400,
          color:         danger ? 'oklch(0.50 0.20 22)' : 'var(--ink)',
          letterSpacing: '-0.03em',
          lineHeight:    1,
        }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', fontSize: '13px', color: 'oklch(0.50 0.20 22)' }}>
        Failed to load SLA metrics
      </div>
    );
  }

  const pct = metrics?.slaComplianceRate ?? 0;
  const R = 52, C = 2 * Math.PI * R;
  const strokeColor = pct >= 90 ? 'oklch(0.62 0.18 148)' : pct >= 75 ? 'oklch(0.65 0.18 50)' : 'oklch(0.60 0.20 22)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize:      '36px',
            fontFamily:    'var(--font-display)',
            fontWeight:    400,
            color:         'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight:    1.05,
            margin:        0,
          }}>
            SLA Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>
            Service Level Agreement metrics and compliance
          </p>
        </div>
        <button
          onClick={() => breachMutation.mutate()}
          disabled={breachMutation.isPending}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 14px',
            fontSize:     '13px',
            fontWeight:   500,
            border:       0,
            borderRadius: '10px',
            background:   'var(--surface-2)',
            color:        breachMutation.isPending ? 'var(--mute)' : 'var(--ink-soft)',
            cursor:       breachMutation.isPending ? 'not-allowed' : 'pointer',
            boxShadow:    'var(--shadow-sm)',
            transition:   'all 120ms',
          }}
        >
          <HugeiconsIcon icon={Alert02Icon} size={14} />
          Check Breaches
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard title="Compliance Rate" value={metrics ? `${metrics.slaComplianceRate}%` : undefined} icon={CheckmarkCircle01Icon} loading={isLoading} />
        <StatCard title="Active SLAs"     value={metrics?.totalTickets}   icon={DashboardSpeed01Icon}   loading={isLoading} />
        <StatCard title="Breached"         value={metrics?.breachedCount}  icon={Alert02Icon}            loading={isLoading} danger />
        <StatCard title="Avg Resolution"   value={metrics ? `${metrics.avgResolutionTime}h` : undefined} icon={Clock01Icon} loading={isLoading} />
      </div>

      {/* Detail cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Compliance ring */}
        <Card padded={false}>
          <CardHead title="Compliance Overview" />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            {isLoading ? (
              <div style={{ width: '112px', height: '112px', borderRadius: '999px', background: 'var(--surface-2)' }} />
            ) : (
              <>
                <div style={{ position: 'relative', width: '112px', height: '112px' }}>
                  <svg width="112" height="112" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r={R}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - pct / 100)}
                      style={{ transition: 'stroke-dashoffset 600ms ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--mute)', margin: 0 }}>
                  {metrics?.withinSlaCount ?? 0} of {metrics?.totalTickets ?? 0} within SLA
                </p>
              </>
            )}
          </div>
        </Card>

        {/* By priority */}
        <Card padded={false}>
          <CardHead title="By Priority" />
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoading ? (
              [1,2,3,4].map((i) => (
                <div key={i} style={{ height: '28px', background: 'var(--surface-2)', borderRadius: '8px' }} />
              ))
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span>Priority</span>
                  <span>Total / Breached</span>
                </div>
                {(metrics?.byPriority ?? []).map((p) => {
                  const hue = PRIORITY_HUE[p.priority] ?? 270;
                  return (
                    <div key={p.priority} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        padding: '3px 9px', fontSize: '11px', fontWeight: 600,
                        borderRadius: '6px',
                        background: `oklch(0.94 0.06 ${hue})`,
                        color:      `oklch(0.38 0.16 ${hue})`,
                      }}>
                        {p.priority}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--ink)', fontWeight: 500, fontFeatureSettings: '"tnum"' }}>{p.total}</span>
                        <span style={{ color: 'var(--mute)' }}>/</span>
                        <span style={{ color: p.breached > 0 ? 'oklch(0.50 0.20 22)' : 'var(--mute)', fontWeight: p.breached > 0 ? 600 : 400, fontFeatureSettings: '"tnum"' }}>
                          {p.breached}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
