'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardHeader, CardContent, Skeleton } from '@heroui/react';
import { Ticket, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  openCount: number;
  closedCount: number;
  pendingCount: number;
  avgFirstResponseHours: number | null;
  byPriority: { priority: string; count: number }[];
  byCategory: { name: string; count: number }[];
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient<{ data: DashboardStats }>('/analytics/stats'),
  });

  const stats = data?.data;

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center text-danger">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-default-500">Overview of your support queue</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm font-medium">By Priority</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <div className="flex flex-col gap-2">
                {stats?.byPriority.map((p) => (
                  <div key={p.priority} className="flex items-center justify-between py-1">
                    <span className="text-sm capitalize text-default-500">{p.priority.toLowerCase()}</span>
                    <span className="text-sm font-semibold">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium">By Category</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <div className="flex flex-col gap-2">
                {stats?.byCategory.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-1">
                    <span className="text-sm text-default-500">{c.name}</span>
                    <span className="text-sm font-semibold">{c.count}</span>
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
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex items-center justify-between pb-1">
        <span className="text-sm text-default-500">{title}</span>
        <Icon className="h-4 w-4 text-default-400" />
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-8 w-20 rounded-lg" />
        ) : (
          <p className="text-2xl font-semibold">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
