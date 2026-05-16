'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardHeader, CardContent, Skeleton } from '@heroui/react';
import { Users, Ticket, MessageSquare, Activity } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalTickets: number;
  totalComments: number;
  activeSessions: number;
  usersByRole: { role: string; count: number }[];
}

export default function AdminSettingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient<{ data: SystemStats }>('/admin/stats'),
  });

  const stats = data?.data;

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive">
        Failed to load system stats
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">System information and configuration</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} loading={isLoading} />
        <StatCard title="Total Tickets" value={stats?.totalTickets} icon={Ticket} loading={isLoading} />
        <StatCard title="Total Comments" value={stats?.totalComments} icon={MessageSquare} loading={isLoading} />
        <StatCard title="Active Sessions" value={stats?.activeSessions} icon={Activity} loading={isLoading} />
      </div>

      <Card>
        <CardHeader><p className="text-sm font-medium">Users by Role</p></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <div className="space-y-2">
              {stats?.usersByRole.map((r) => (
                <div key={r.role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {r.role === 'SUPER_ADMIN' ? 'Super Admin' : r.role.toLowerCase()}
                  </span>
                  <span className="text-sm font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: any) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20 rounded-lg" />
        ) : (
          <p className="text-2xl font-bold">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
