'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardHeader, CardContent, Button, Skeleton, Chip } from '@heroui/react';
import { toast } from 'sonner';
import { Gauge, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SlaMetrics {
  totalTickets: number;
  breachedCount: number;
  withinSlaCount: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  byPriority: { priority: string; total: number; breached: number }[];
}

export default function SlaPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sla-metrics'],
    queryFn: () => apiClient<SlaMetrics>('/sla/metrics'),
  });

  const breachMutation = useMutation({
    mutationFn: () => apiClient<{ breached: number }>('/sla/check-breaches', { method: 'POST' }),
    onSuccess: (res) => {
      toast.success(`Checked breaches: ${res.breached} found`);
      queryClient.invalidateQueries({ queryKey: ['sla-metrics'] });
    },
    onError: () => toast.error('Failed to check breaches'),
  });

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load SLA metrics
      </div>
    );
  }

  const metrics = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SLA Dashboard</h1>
          <p className="text-sm text-muted-foreground">Service Level Agreement metrics and compliance</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => breachMutation.mutate()}
          isDisabled={breachMutation.isPending}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Check Breaches
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compliance Rate"
          value={metrics ? `${metrics.slaComplianceRate}%` : undefined}
          icon={CheckCircle}
          loading={isLoading}
        />
        <StatCard
          title="Active SLAs"
          value={metrics?.totalTickets}
          icon={Gauge}
          loading={isLoading}
        />
        <StatCard
          title="Breached"
          value={metrics?.breachedCount}
          icon={AlertTriangle}
          loading={isLoading}
          danger
        />
        <StatCard
          title="Avg Resolution"
          value={metrics ? `${metrics.avgResolutionTime}h` : undefined}
          icon={Clock}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><p className="text-sm font-medium">Compliance Gauge</p></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="relative h-28 w-28">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke={
                        (metrics?.slaComplianceRate ?? 0) >= 90 ? 'hsl(var(--success))' :
                        (metrics?.slaComplianceRate ?? 0) >= 75 ? 'hsl(var(--warning))' :
                        'hsl(var(--destructive))'
                      }
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - (metrics?.slaComplianceRate ?? 0) / 100)}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{metrics?.slaComplianceRate ?? 0}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {metrics?.withinSlaCount ?? 0} of {metrics?.totalTickets ?? 0} tickets within SLA
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><p className="text-sm font-medium">By Priority</p></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Priority</span>
                  <span>Total / Breached</span>
                </div>
                {metrics?.byPriority.map((p) => (
                  <div key={p.priority} className="flex items-center justify-between">
                    <Chip variant="soft" size="sm">{p.priority}</Chip>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{p.total}</span>
                      <span className="text-xs text-muted-foreground">/</span>
                      <span className={`text-sm ${p.breached > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {p.breached}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, danger }: any) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className={`h-4 w-4 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20 rounded-lg" />
        ) : (
          <p className={`text-2xl font-bold ${danger ? 'text-destructive' : ''}`}>{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
