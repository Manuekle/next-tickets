'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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
        <Select value={days} onValueChange={(v) => v && setDays(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card size="sm">
          <CardHeader><CardTitle>Created</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-xl font-bold">{totals?.created ?? 0}</div>}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader><CardTitle>Resolved</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-xl font-bold">{totals?.resolved ?? 0}</div>}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader><CardTitle>Open</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-xl font-bold">{totals?.open ?? 0}</div>}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader><CardTitle>Critical</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-6 w-16" /> : <div className="text-xl font-bold">{totals?.critical ?? 0}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Created vs Resolved</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
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

  const th = (column: keyof AgentRow, label: string) => (
    <TableHead
      key={column}
      className="cursor-pointer select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load agent data
      </div>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Agent Performance</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sorted.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {th('name', 'Name')}
                {th('assigned', 'Assigned')}
                {th('resolved', 'Resolved')}
                {th('comments', 'Comments')}
                {th('avgResponseTimeHours', 'Avg Response (h)')}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((agent) => (
                <TableRow key={agent.name}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.assigned}</TableCell>
                  <TableCell>{agent.resolved}</TableCell>
                  <TableCell>{agent.comments}</TableCell>
                  <TableCell>
                    {agent.avgResponseTimeHours != null
                      ? `${agent.avgResponseTimeHours.toFixed(1)}h`
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      <CardHeader><CardTitle>Ticket Volume by Day/Hour</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56" />
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
          <CardHeader><CardTitle>Compliance Rate</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="text-3xl font-bold">
                {sla ? `${(sla.complianceRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Compliant</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-xl font-bold text-green-600">{sla?.compliant ?? 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Breached</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-xl font-bold text-destructive">{sla?.breached ?? 0}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>SLA Overview</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16" />
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
    <Button variant="outline" onClick={handleExport} loading={loading}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Insights and metrics for your support queue</p>
        </div>
        <ExportButton />
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Trends
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Agents
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Heatmap
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> SLA
          </TabsTrigger>
        </TabsList>
        <TabsContent value="trends"><TrendsTab /></TabsContent>
        <TabsContent value="agents"><AgentsTab /></TabsContent>
        <TabsContent value="heatmap"><HeatmapTab /></TabsContent>
        <TabsContent value="sla"><SLATab /></TabsContent>
      </Tabs>
    </div>
  );
}
