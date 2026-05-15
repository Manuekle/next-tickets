'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  openCount: number;
  closedCount: number;
  pendingCount: number;
  avgFirstResponseHours: number | null;
  byPriority: { priority: string; count: number }[];
  byCategory: { name: string; count: number }[];
  recentActivity: { id: string; action: string; user: { name: string }; createdAt: string }[];
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient<{ data: DashboardStats }>('/dashboard/stats'),
  });

  const stats = data?.data;

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center text-destructive">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your support queue</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Open Tickets" value={stats?.openCount} icon={Ticket} loading={isLoading} />
        <StatCard title="Closed" value={stats?.closedCount} icon={CheckCircle} loading={isLoading} />
        <StatCard title="Pending" value={stats?.pendingCount} icon={Clock} loading={isLoading} />
        <StatCard
          title="Avg Response"
          value={stats?.avgFirstResponseHours ? `${stats.avgFirstResponseHours.toFixed(1)}h` : 'N/A'}
          icon={AlertTriangle}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">By Priority</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32" /> : (
              <div className="space-y-2">
                {stats?.byPriority.map((p) => (
                  <div key={p.priority} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{p.priority.toLowerCase()}</span>
                    <span className="text-sm font-medium">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32" /> : (
              <div className="space-y-2">
                {stats?.byCategory.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-sm">{c.name}</span>
                    <span className="text-sm font-medium">{c.count}</span>
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

function StatCard({ title, value, icon: Icon, loading }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
