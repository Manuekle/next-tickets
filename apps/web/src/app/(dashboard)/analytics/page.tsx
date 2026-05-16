'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardHeader, CardContent, Button, Skeleton, Chip } from '@heroui/react';
import { Select, SelectTrigger, SelectValue, SelectPopover } from '@heroui/react';
import { ListBox, ListBoxItem } from '@heroui/react';
import { BarChart } from '@/components/analytics/bar-chart';
import { Heatmap } from '@/components/analytics/heatmap';
import { Download, TrendingUp, Users, Calendar, Shield, ArrowUpDown } from 'lucide-react';

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

function TrendsTab() {
  const [days, setDays] = useState('30');
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-trends', days],
    queryFn: () => apiClient<TrendsResponse>(`/analytics/trends?days=${days}`),
  });

  if (error) {
    return <div className="flex h-40 items-center justify-center text-[#DE350B]">Failed to load trends</div>;
  }

  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select aria-label="Time range" onSelectionChange={(keys) => setDays(String(keys) || '30')}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectPopover>
            <ListBox>
              {DAY_RANGES.map((r) => (
                <ListBoxItem key={r.value} id={r.value}>{r.label}</ListBoxItem>
              ))}
            </ListBox>
          </SelectPopover>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Created" value={totals?.created} loading={isLoading} />
        <StatCard title="Resolved" value={totals?.resolved} loading={isLoading} />
        <StatCard title="Open" value={totals?.open} loading={isLoading} />
        <StatCard title="Critical" value={totals?.critical} loading={isLoading} />
      </div>

      <Card className="rounded-sm border border-[#DFE1E6] bg-white">
        <CardHeader><span className="text-sm font-semibold text-[#172B4D]">Created vs Resolved</span></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 rounded-sm" />
          ) : data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="mb-2 text-sm font-medium text-[#6B778C]">Created</h4>
                <BarChart data={data.data.map((d) => ({ label: d.date, value: d.created }))} height={180} />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-[#6B778C]">Resolved</h4>
                <BarChart data={data.data.map((d) => ({ label: d.date, value: d.resolved }))} height={180} />
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-[#6B778C]">No trend data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

  if (error) {
    return <div className="flex h-40 items-center justify-center text-[#DE350B]">Failed to load agent data</div>;
  }

  return (
    <Card className="rounded-sm border border-[#DFE1E6] bg-white">
      <CardHeader><span className="text-sm font-semibold text-[#172B4D]">Agent Performance</span></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-8 w-full rounded-sm" />
          </div>
        ) : sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DFE1E6]">
                  {(['name', 'assigned', 'resolved', 'comments', 'avgResponseTimeHours'] as const).map((col) => (
                    <th
                      key={col}
                      className="cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold text-[#6B778C] uppercase tracking-wider"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        {col === 'name' ? 'Name' : col === 'assigned' ? 'Assigned' : col === 'resolved' ? 'Resolved' : col === 'comments' ? 'Comments' : 'Avg Response'}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((agent) => (
                  <tr key={agent.name} className="border-b border-[#DFE1E6] last:border-0">
                    <td className="px-3 py-2 font-medium text-[#172B4D]">{agent.name}</td>
                    <td className="px-3 py-2 text-[#172B4D]">{agent.assigned}</td>
                    <td className="px-3 py-2 text-[#172B4D]">{agent.resolved}</td>
                    <td className="px-3 py-2 text-[#172B4D]">{agent.comments}</td>
                    <td className="px-3 py-2 text-[#6B778C]">{agent.avgResponseTimeHours != null ? `${agent.avgResponseTimeHours.toFixed(1)}h` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-[#6B778C]">No agent data available</div>
        )}
      </CardContent>
    </Card>
  );
}

function HeatmapTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-heatmap'],
    queryFn: () => apiClient<HeatmapResponse>('/analytics/heatmap'),
  });

  if (error) {
    return <div className="flex h-40 items-center justify-center text-[#DE350B]">Failed to load heatmap</div>;
  }

  return (
    <Card className="rounded-sm border border-[#DFE1E6] bg-white">
      <CardHeader><span className="text-sm font-semibold text-[#172B4D]">Ticket Volume by Day/Hour</span></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 rounded-sm" />
        ) : data?.data && data.data.length > 0 ? (
          <Heatmap data={data.data} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-[#6B778C]">No heatmap data available</div>
        )}
      </CardContent>
    </Card>
  );
}

function SLATab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-sla'],
    queryFn: () => apiClient<SLAResponse>('/analytics/sla'),
  });

  if (error) {
    return <div className="flex h-40 items-center justify-center text-[#DE350B]">Failed to load SLA data</div>;
  }

  const sla = data?.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-sm border border-[#DFE1E6] bg-white">
          <CardHeader><span className="text-sm font-medium text-[#6B778C]">Compliance Rate</span></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24 rounded-sm" />
            ) : (
              <p className="text-3xl font-bold text-[#172B4D]">{sla ? `${(sla.complianceRate * 100).toFixed(1)}%` : 'N/A'}</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-[#DFE1E6] bg-white">
          <CardHeader><span className="text-sm font-medium text-[#6B778C]">Compliant</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 rounded-sm" /> : <p className="text-xl font-bold text-[#36B37E]">{sla?.compliant ?? 0}</p>}
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-[#DFE1E6] bg-white">
          <CardHeader><span className="text-sm font-medium text-[#6B778C]">Breached</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 rounded-sm" /> : <p className="text-xl font-bold text-[#DE350B]">{sla?.breached ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-sm border border-[#DFE1E6] bg-white">
        <CardHeader><span className="text-sm font-semibold text-[#172B4D]">SLA Overview</span></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 rounded-sm" />
          ) : sla ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#172B4D]">Total SLA tickets: <strong>{sla.total}</strong></span>
                <span className="text-[#6B778C]">{sla.compliant} compliant / {sla.breached} breached</span>
              </div>
              <div className="flex h-6 w-full overflow-hidden rounded-sm bg-[#DFE1E6]">
                <div className="bg-[#36B37E] transition-all" style={{ width: `${(sla.compliant / Math.max(sla.total, 1)) * 100}%` }} />
                <div className="bg-[#DE350B] transition-all" style={{ width: `${(sla.breached / Math.max(sla.total, 1)) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex h-12 items-center justify-center text-sm text-[#6B778C]">No SLA data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
    <Button variant="secondary" size="sm" onClick={handleExport} isDisabled={loading}>
      <Download className="h-4 w-4" />
      <span className="ml-1.5">Export CSV</span>
    </Button>
  );
}

function StatCard({ title, value, loading }: { title: string; value?: number | string; loading: boolean }) {
  return (
    <Card className="rounded-sm border border-[#DFE1E6] bg-white">
      <CardHeader><span className="text-sm font-medium text-[#6B778C]">{title}</span></CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-6 w-16 rounded-sm" /> : <p className="text-xl font-bold text-[#172B4D]">{value ?? 0}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState('trends');

  const tabs = [
    { key: 'trends', label: 'Trends', icon: TrendingUp },
    { key: 'agents', label: 'Agents', icon: Users },
    { key: 'heatmap', label: 'Heatmap', icon: Calendar },
    { key: 'sla', label: 'SLA', icon: Shield },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#172B4D]">Analytics</h1>
          <p className="text-sm text-[#6B778C]">Insights and metrics for your support queue</p>
        </div>
        <ExportButton />
      </div>

      <div className="flex gap-1 border-b border-[#DFE1E6]">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#0052CC] text-[#0052CC]'
                : 'text-[#6B778C] hover:text-[#172B4D]'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'trends' && <TrendsTab />}
      {tab === 'agents' && <AgentsTab />}
      {tab === 'heatmap' && <HeatmapTab />}
      {tab === 'sla' && <SLATab />}
    </div>
  );
}
