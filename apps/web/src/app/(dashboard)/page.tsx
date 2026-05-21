'use client';
export const dynamic = 'force-dynamic';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon, Alert02Icon, CheckmarkCircle01Icon, Clock01Icon,
  FilterIcon, BubbleChatIcon, Search01Icon,
} from '@hugeicons/core-free-icons';
import { formatDistanceToNow } from 'date-fns';
import { CreateTicketDrawer, TicketDetailDrawer } from '@/components/drawers/ticket-drawer';
import { CriticalBanner } from '@/components/tickets/critical-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Ticket01Icon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Badge, categoryVariant, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ─── types ─── */
interface Ticket {
  id: string; title: string; description: string;
  status: string; priority: string;
  category?: { name: string } | null;
  assignedTo?: { name: string } | null;
  customer?: { name: string; email: string } | null;
  createdAt: string; updatedAt: string;
  _count?: { comments: number };
}
interface DashboardStats {
  openCount: number; closedCount: number; pendingCount: number; avgFirstResponseHours: number | null;
}

/* ─── helpers ─── */
const PRIORITY_BAR: Record<string, string> = {
  CRITICAL: 'bg-danger',
  HIGH:     'bg-warning',
  MEDIUM:   'bg-info',
  LOW:      'bg-mute-soft',
};
const STATUS_META: Record<string, { label: string; variant: BadgeProps['variant']; icon: typeof Alert02Icon }> = {
  OPEN:                { label: 'Open',        variant: 'info',    icon: Alert02Icon          },
  IN_PROGRESS:         { label: 'In Progress', variant: 'neutral', icon: Clock01Icon          },
  WAITING_ON_CUSTOMER: { label: 'Waiting',     variant: 'warning', icon: Clock01Icon          },
  RESOLVED:            { label: 'Resolved',    variant: 'success', icon: CheckmarkCircle01Icon },
  CLOSED:              { label: 'Closed',      variant: 'neutral', icon: CheckmarkCircle01Icon },
};
const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Open',        value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Waiting',     value: 'WAITING_ON_CUSTOMER' },
  { label: 'Resolved',    value: 'RESOLVED' },
];

/* ─── sub-components ─── */
function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <Card hover className="flex min-w-[96px] flex-col gap-1 px-4 py-3">
      <span className="text-[11px] font-medium uppercase tracking-wide text-mute">{label}</span>
      <span className="font-mono text-[22px] font-bold leading-none text-ink">{value}</span>
    </Card>
  );
}

function PriorityBar({ priority }: { priority: string }) {
  return (
    <div className={cn('absolute bottom-2 left-0 top-2 w-[3px] rounded-r-sm', PRIORITY_BAR[priority] ?? 'bg-border')} />
  );
}

function StatusChip({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <Badge variant={m.variant}>
      <HugeiconsIcon icon={m.icon} size={10} />
      {m.label}
    </Badge>
  );
}

function TicketRow({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full items-start gap-3 border-b border-border py-3 pl-5 pr-3.5 text-left transition-colors',
        active ? 'bg-accent-tint shadow-[inset_2px_0_0_var(--accent)]' : 'hover:bg-surface-2',
      )}
    >
      <PriorityBar priority={ticket.priority} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className={cn('truncate text-[13px] leading-tight text-ink', active ? 'font-bold' : 'font-semibold')}>
            {ticket.title}
          </span>
          <span className="mt-px shrink-0 text-[11px] text-mute">
            {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
          </span>
        </div>
        {ticket.description && (
          <p className="mb-1.5 line-clamp-2 text-xs leading-relaxed text-mute">
            {ticket.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusChip status={ticket.status} />
          {ticket.category && (
            <Badge variant={categoryVariant(ticket.category.name)}>{ticket.category.name}</Badge>
          )}
          {(ticket._count?.comments ?? 0) > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-mute">
              <HugeiconsIcon icon={BubbleChatIcon} size={10} />
              {ticket._count!.comments}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── main page ─── */
export default function InboxPage() {
  const [status, setStatus]         = useState('');
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: Record<string, string> = {};
  if (status)         params.status = status;
  if (debouncedSearch) params.q    = debouncedSearch;
  params.limit = '50';

  const { data: ticketsRes, isLoading } = useQuery({
    queryKey: ['inbox-tickets', status, debouncedSearch],
    queryFn: () => apiClient<{ data: Ticket[] }>('/tickets', { params }),
  });
  const tickets = ticketsRes?.data ?? [];

  const { data: statsRes } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient<{ data: DashboardStats }>('/analytics/stats'),
  });
  const stats = statsRes?.data;

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h1>Inbox</h1>
          <p className="mt-0.5 text-[13px] text-mute">
            {isLoading ? '…' : `${tickets.length} tickets`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="lg">
          <HugeiconsIcon icon={Add01Icon} size={14} />
          New ticket
        </Button>
      </div>

      {/* Critical tickets */}
      <CriticalBanner />

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <StatChip label="Open"        value={stats.openCount} />
          <StatChip label="In Progress" value={stats.pendingCount} />
          <StatChip label="Resolved"    value={stats.closedCount} />
          {stats.avgFirstResponseHours != null && (
            <StatChip label="Avg response" value={`${Math.round(stats.avgFirstResponseHours)}h`} />
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="overflow-hidden">
        {/* Search + filter row */}
        <div className="flex items-center gap-2 border-b border-border p-3">
          <div className="relative max-w-[320px] flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={13}
              color="var(--mute)"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
            />
            <Input
              type="text"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-transparent bg-surface-2 pl-7"
            />
          </div>
          <HugeiconsIcon icon={FilterIcon} size={13} color="var(--mute)" />
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs transition-all',
                  status === f.value
                    ? 'bg-accent font-semibold text-accent-fg shadow-sm'
                    : 'font-medium text-ink-soft hover:bg-surface-2',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 border-b border-border px-5 py-3.5">
                <Skeleton height={14} width={`${55 + (i % 3) * 15}%`} />
                <Skeleton height={12} width={`${70 + (i % 4) * 8}%`} />
                <Skeleton height={18} width={80} />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket01Icon}
            title="No tickets found"
            description="Try adjusting the filters or create a new ticket."
          />
        ) : (
          <div>
            {tickets.map((t) => (
              <TicketRow
                key={t.id}
                ticket={t}
                active={t.id === selectedId}
                onClick={() => setSelectedId(t.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Drawers */}
      <CreateTicketDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <TicketDetailDrawer ticketId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
