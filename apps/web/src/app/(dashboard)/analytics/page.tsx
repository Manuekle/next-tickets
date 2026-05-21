'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { TrendingUpDownIcon, UserGroupIcon, Calendar01Icon, ShieldKeyIcon, Download01Icon, ArrowUpDownIcon, ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { BarChart } from '@/components/analytics/bar-chart';
import { Heatmap } from '@/components/analytics/heatmap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TrendDay {
  date: string;
  created: number;
  resolved: number;
  open: number;
  critical: number;
}

interface TrendsResponse {
  data: TrendDay[];
  totals: { created: number; resolved: number; open: number; critical: number };
}

interface AgentRow {
  name: string;
  assigned: number;
  resolved: number;
  comments: number;
  avgResponseTimeHours: number | null;
}

interface AgentsResponse {
  data: AgentRow[];
}

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface HeatmapResponse {
  data: HeatmapCell[];
}

interface SLAResponse {
  data: {
    complianceRate: number;
    total: number;
    compliant: number;
    breached: number;
  };
}

const DAY_RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
] as const;

const TABS = [
  { key: 'trends',  label: 'Trends',  icon: TrendingUpDownIcon },
  { key: 'agents',  label: 'Agents',  icon: UserGroupIcon      },
  { key: 'heatmap', label: 'Heatmap', icon: Calendar01Icon     },
  { key: 'sla',     label: 'SLA',     icon: ShieldKeyIcon      },
] as const;

/* ─── small primitives ─── */

function CardHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
      <h3>{title}</h3>
      {right}
    </div>
  );
}

function StatCard({ title, value, loading, tone = 'ink' }: {
  title: string; value?: number | string; loading: boolean; tone?: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">{title}</div>
      {loading ? (
        <Skeleton width={60} height={32} radius={8} />
      ) : (
        <div
          className={cn(
            'font-display text-[30px] font-normal leading-none -tracking-[0.03em] tabular-nums',
            tone === 'mute' ? 'text-mute' : 'text-ink',
          )}
        >
          {value ?? 0}
        </div>
      )}
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-[13px] text-danger">
      {message}
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex h-[120px] items-center justify-center text-[13px] text-mute">
      {message}
    </div>
  );
}

/* ─── Trends tab ─── */

function TrendsTab() {
  const [days, setDays] = useState('30');
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-trends', days],
    queryFn: () => apiClient<TrendsResponse>(`/analytics/trends?days=${days}`),
  });

  if (error) return <ErrorState message="Failed to load trends" />;
  const totals = data?.totals;

  return (
    <div className="flex flex-col gap-4">
      {/* Range selector */}
      <div className="flex items-center gap-1.5">
        {DAY_RANGES.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={days === r.value ? 'primary' : 'secondary'}
            onClick={() => setDays(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard title="Created"  value={totals?.created}  loading={isLoading} />
        <StatCard title="Resolved" value={totals?.resolved} loading={isLoading} />
        <StatCard title="Open"     value={totals?.open}     loading={isLoading} />
        <StatCard title="Critical" value={totals?.critical} loading={isLoading} tone="mute" />
      </div>

      {/* Charts */}
      <Card className="overflow-hidden">
        <CardHead title="Created vs Resolved" />
        <div className="p-5">
          {isLoading ? (
            <Skeleton height={180} radius={10} />
          ) : data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">Created</div>
                <BarChart data={data.data.map((d) => ({ label: d.date, value: d.created }))} height={180} />
              </div>
              <div>
                <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">Resolved</div>
                <BarChart data={data.data.map((d) => ({ label: d.date, value: d.resolved }))} height={180} />
              </div>
            </div>
          ) : (
            <EmptyMessage message="No trend data available" />
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─── Agents tab ─── */

function AgentsTab() {
  const [sortKey, setSortKey] = useState<keyof AgentRow>('resolved');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-agents'],
    queryFn: () => apiClient<AgentsResponse>('/analytics/agents'),
  });

  const handleSort = (key: keyof AgentRow) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...(data?.data ?? [])].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const cols: { key: keyof AgentRow; label: string }[] = [
    { key: 'name',                 label: 'Name'         },
    { key: 'assigned',             label: 'Assigned'     },
    { key: 'resolved',             label: 'Resolved'     },
    { key: 'comments',             label: 'Comments'     },
    { key: 'avgResponseTimeHours', label: 'Avg Response' },
  ];

  if (error) return <ErrorState message="Failed to load agent data" />;

  return (
    <Card className="overflow-hidden">
      <CardHead title="Agent Performance" />
      {isLoading ? (
        <div className="flex flex-col gap-2.5 p-5">
          {[1,2,3,4].map((i) => (
            <Skeleton key={i} height={32} radius={8} />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-2 hover:bg-surface-2">
              {cols.map((col) => (
                <TableHead
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    'cursor-pointer select-none whitespace-nowrap px-[18px]',
                    sortKey === col.key ? 'text-ink' : 'text-mute',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <HugeiconsIcon icon={ArrowUp01Icon} size={11} /> : <HugeiconsIcon icon={ArrowDown01Icon} size={11} />
                    ) : (
                      <HugeiconsIcon icon={ArrowUpDownIcon} size={11} className="opacity-40" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((agent) => (
              <TableRow key={agent.name}>
                <TableCell className="px-[18px] font-medium text-ink">{agent.name}</TableCell>
                <TableCell className="px-[18px] tabular-nums text-ink">{agent.assigned}</TableCell>
                <TableCell className="px-[18px] tabular-nums text-ink">{agent.resolved}</TableCell>
                <TableCell className="px-[18px] tabular-nums text-ink">{agent.comments}</TableCell>
                <TableCell className="px-[18px] text-xs text-mute">
                  {agent.avgResponseTimeHours != null ? `${agent.avgResponseTimeHours.toFixed(1)}h` : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyMessage message="No agent data available" />
      )}
    </Card>
  );
}

/* ─── Heatmap tab ─── */

function HeatmapTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-heatmap'],
    queryFn: () => apiClient<HeatmapResponse>('/analytics/heatmap'),
  });

  if (error) return <ErrorState message="Failed to load heatmap" />;

  return (
    <Card className="overflow-hidden">
      <CardHead title="Ticket Volume by Day / Hour" />
      <div className="p-5">
        {isLoading ? (
          <Skeleton height={220} radius={10} />
        ) : data?.data && data.data.length > 0 ? (
          <Heatmap data={data.data} />
        ) : (
          <EmptyMessage message="No heatmap data available" />
        )}
      </div>
    </Card>
  );
}

/* ─── SLA tab ─── */

function SLATab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-sla'],
    queryFn: () => apiClient<SLAResponse>('/analytics/sla'),
  });

  if (error) return <ErrorState message="Failed to load SLA data" />;
  const sla = data?.data;

  const pct = sla ? Math.round(sla.complianceRate * 100) : 0;
  const R = 56, C = 2 * Math.PI * R;
  void C;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          [1,2,3].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton height={40} radius={8} />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-5">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">Compliance Rate</div>
              <div className="font-display text-[30px] leading-none -tracking-[0.03em] tabular-nums text-ink">
                {sla ? `${pct}%` : 'N/A'}
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">Compliant</div>
              <div className="font-display text-[30px] leading-none -tracking-[0.03em] tabular-nums text-success">
                {sla?.compliant ?? 0}
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">Breached</div>
              <div className="font-display text-[30px] leading-none -tracking-[0.03em] tabular-nums text-danger">
                {sla?.breached ?? 0}
              </div>
            </Card>
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardHead title="SLA Overview" />
        <div className="p-5">
          {isLoading ? (
            <Skeleton height={64} radius={10} />
          ) : sla ? (
            <div className="flex flex-col gap-3.5">
              {/* Gauge arc */}
              <div className="flex items-center gap-7">
                <div className="relative h-[100px] w-[130px] shrink-0">
                  <svg width="130" height="100" viewBox="0 0 130 100">
                    <path d="M 12 88 A 53 53 0 1 1 118 88" fill="none" stroke="var(--surface-2)" strokeWidth="10" strokeLinecap="round" />
                    <path
                      d="M 12 88 A 53 53 0 1 1 118 88"
                      fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - pct}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                    <div className="font-display text-[28px] leading-none -tracking-[0.03em] text-ink">
                      {pct}<span className="text-sm text-mute">%</span>
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-mute">
                      within SLA
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2.5">
                  {[
                    { variant: 'success' as const, label: 'On track',  value: sla.compliant },
                    { variant: 'warning' as const, label: 'At risk',   value: Math.max(0, sla.total - sla.compliant - sla.breached) },
                    { variant: 'danger'  as const, label: 'Breached',  value: sla.breached  },
                  ].map(({ variant, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <Badge variant={variant}>{label}</Badge>
                      <span className="font-semibold tabular-nums text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-mute">
                  <span>Total: <strong className="text-ink">{sla.total}</strong></span>
                  <span>{sla.compliant} compliant · {sla.breached} breached</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="bg-success transition-[width] duration-[400ms] ease-in-out" style={{ width: `${(sla.compliant / Math.max(sla.total, 1)) * 100}%` }} />
                  <div className="bg-danger transition-[width] duration-[400ms] ease-in-out" style={{ width: `${(sla.breached / Math.max(sla.total, 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyMessage message="No SLA data available" />
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─── Export button ─── */

function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API}/analytics/export/csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open('/api/analytics/export/csv', '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={loading}>
      <HugeiconsIcon icon={Download01Icon} size={14} />
      Export CSV
    </Button>
  );
}

/* ─── Page ─── */

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'trends' | 'agents' | 'heatmap' | 'sla'>('trends');

  return (
    <div className="flex flex-col gap-6">
      {/* Page head */}
      <div className="flex items-start justify-between">
        <div>
          <h1>Analytics</h1>
          <p className="mt-1.5 text-[13px] text-mute">
            Insights and metrics for your support queue
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Tab bar */}
      <Tabs value={tab} onValueChange={(v: unknown) => setTab(v as typeof tab)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTab key={t.key} value={t.key} className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={t.icon} size={14} />
              {t.label}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab content */}
      {tab === 'trends'  && <TrendsTab />}
      {tab === 'agents'  && <AgentsTab />}
      {tab === 'heatmap' && <HeatmapTab />}
      {tab === 'sla'     && <SLATab />}
    </div>
  );
}
