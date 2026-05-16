'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardHeader, CardContent, Button, Skeleton, Chip } from '@heroui/react';
import { Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem } from '@heroui/react';
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
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load trends
      </div>
    );
  }

  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select onSelectionChange={(keys) => setDays(String(keys) || '30')}>
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
        <Card>
          <CardHeader><span className="text-sm font-medium">Created</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16 rounded-lg" /> : <p className="text-xl font-bold">{totals?.created ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><span className="text-sm font-medium">Resolved</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16 rounded-lg" /> : <p className="text-xl font-bold">{totals?.resolved ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><span className="text-sm font-medium">Open</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16 rounded-lg" /> : <p className="text-xl font-bold">{totals?.open ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><span className="text-sm font-medium">Critical</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16 rounded-lg" /> : <p className="text-xl font-bold">{totals?.critical ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><span className="text-sm font-medium">Created vs Resolved</span></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : data?.data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Created</h4>
                <BarChart
                  data={data.data.map((d) => ({ label: d.date, value: d.created }))}
                  height={180}
                />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Resolved</h4>
                <BarChart
                  data={data.data.map((d) => ({ label: d.date, value: d.resolved }))}
                  height={180}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No trend data available
            </div>
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
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...(data?.data ?? [])].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load agent data
      </div>
    );
  }

  return (
    <Card>
      <CardHeader><span className="text-sm font-medium">Agent Performance</span></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ) : sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {(['name', 'assigned', 'resolved', 'comments', 'avgResponseTimeHours'] as const).map((col) => (
                    <th
                      key={col}
                      className="cursor-pointer select-none px-3 py-2 text-left font-medium text-muted-foreground"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        {col === 'name' ? 'Name' : col === 'assigned' ? 'Assigned' : col === 'resolved' ? 'Resolved' : col === 'comments' ? 'Comments' : 'Avg Response (h)'}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((agent) => (
                  <tr key={agent.name} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{agent.name}</td>
                    <td className="px-3 py-2">{agent.assigned}</td>
                    <td className="px-3 py-2">{agent.resolved}</td>
                    <td className="px-3 py-2">{agent.comments}</td>
                    <td className="px-3 py-2">{agent.avgResponseTimeHours != null ? `${agent.avgResponseTimeHours.toFixed(1)}h` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            No agent data available
          </div>
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
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load heatmap
      </div>
    );
  }

  return (
    <Card>
      <CardHeader><span className="text-sm font-medium">Ticket Volume by Day/Hour</span></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 rounded-lg" />
        ) : data?.data && data.data.length > 0 ? (
          <Heatmap data={data.data} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No heatmap data available
          </div>
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
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load SLA data
      </div>
    );
  }

  const sla = data?.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><span className="text-sm font-medium">Compliance Rate</span></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24 rounded-lg" />
            ) : (
              <p className="text-3xl font-bold">
                {sla ? `${(sla.complianceRate * 100).toFixed(1)}%` : 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><span className="text-sm font-medium">Compliant</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 rounded-lg" /> : <p className="text-xl font-bold text-green-600">{sla?.compliant ?? 0}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><span className="text-sm font-medium">Breached</span></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 rounded-lg" /> : <p className="text-xl font-bold text-destructive">{sla?.breached ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><span className="text-sm font-medium">SLA Overview</span></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : sla ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total SLA tickets: {sla.total}</span>
                <span className="text-muted-foreground">
                  {sla.compliant} compliant / {sla.breached} breached
                </span>
              </div>
              <div className="flex h-6 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(sla.compliant / Math.max(sla.total, 1)) * 100}%` }}
                />
                <div
                  className="bg-destructive transition-all"
                  style={{ width: `${(sla.breached / Math.max(sla.total, 1)) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-12 items-center justify-center text-sm text-muted-foreground">
              No SLA data available
            </div>
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
      const res = await fetch(`${API}/analytics/export/csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(
        `/api/analytics/export/csv`,
        '_blank'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} isDisabled={loading}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
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
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Insights and metrics for your support queue</p>
        </div>
        <ExportButton />
      </div>

      <div className="flex gap-1 border-b" role="tablist" aria-label="Analytics tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
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
