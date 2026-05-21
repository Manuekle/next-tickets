'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, FireIcon, ArrowRight01Icon, TimeQuarter02Icon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface CriticalTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  slaBreached?: boolean;
  customer?: { name: string };
  updatedAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function CriticalBanner() {
  const { data: critRes } = useQuery({
    queryKey: ['critical-tickets'],
    queryFn: () => apiClient<{ data: CriticalTicket[] }>('/tickets', { params: { priority: 'CRITICAL', limit: '10' } }),
    refetchInterval: 60_000,
  });

  const all = critRes?.data ?? [];
  const active = all.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').slice(0, 5);

  if (active.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-danger/30 bg-danger-tint p-4">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-danger text-white">
          <HugeiconsIcon icon={FireIcon} size={14} />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-danger">Needs attention</div>
          <div className="text-[11px] text-danger/80">
            {active.length} critical ticket{active.length > 1 ? 's' : ''} open
          </div>
        </div>
        <Link
          href="/tickets?priority=CRITICAL"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger hover:underline"
        >
          View all <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        {active.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className="flex items-center gap-2.5 rounded-md bg-surface/60 px-2.5 py-1.5 transition-colors hover:bg-surface"
          >
            <HugeiconsIcon icon={Alert02Icon} size={11} className="text-danger" />
            <span className="font-mono text-[10.5px] font-semibold text-danger">
              #{t.id.slice(-6).toUpperCase()}
            </span>
            <span className="flex-1 truncate text-xs font-medium text-ink">{t.title}</span>
            {t.slaBreached && (
              <Badge variant="danger">
                <HugeiconsIcon icon={TimeQuarter02Icon} size={9} /> SLA
              </Badge>
            )}
            <span className="text-[10.5px] tabular-nums text-mute">{timeAgo(t.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
