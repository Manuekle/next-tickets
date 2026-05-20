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
  CRITICAL: 'oklch(0.58 0.22 22)',
  HIGH:     'oklch(0.70 0.18 50)',
  MEDIUM:   'oklch(0.70 0.14 90)',
  LOW:      'oklch(0.62 0.10 200)',
};
const STATUS_META: Record<string, { label: string; color: string; icon: typeof Alert02Icon }> = {
  OPEN:                { label: 'Open',        color: 'oklch(0.60 0.18 220)', icon: Alert02Icon          },
  IN_PROGRESS:         { label: 'In Progress', color: 'oklch(0.62 0.16 265)', icon: Clock01Icon          },
  WAITING_ON_CUSTOMER: { label: 'Waiting',     color: 'oklch(0.65 0.16 55)',  icon: Clock01Icon          },
  RESOLVED:            { label: 'Resolved',    color: 'oklch(0.55 0.16 148)', icon: CheckmarkCircle01Icon },
  CLOSED:              { label: 'Closed',      color: 'oklch(0.55 0.04 270)', icon: CheckmarkCircle01Icon },
};
const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Open',        value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Waiting',     value: 'WAITING_ON_CUSTOMER' },
  { label: 'Resolved',    value: 'RESOLVED' },
];

/* ─── sub-components ─── */
function StatChip({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      padding: '10px 16px', borderRadius: '12px',
      background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
      minWidth: '80px',
    }}>
      <span style={{ fontSize: '22px', fontWeight: 700, color, fontFeatureSettings: '"tnum"', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

function PriorityBar({ priority }: { priority: string }) {
  return (
    <div style={{
      position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 2px 2px 0',
      background: PRIORITY_BAR[priority] ?? 'var(--hairline)',
    }} />
  );
}

function StatusChip({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
      background: `${m.color}18`, color: m.color, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <HugeiconsIcon icon={m.icon} size={10} />
      {m.label}
    </span>
  );
}

function TicketRow({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '12px',
        width: '100%', textAlign: 'left', padding: '12px 14px 12px 20px',
        border: 0, borderBottom: '1px solid var(--hairline)',
        background: active ? 'var(--accent-tint)' : 'transparent',
        cursor: 'pointer', transition: 'background 80ms',
        boxShadow: active ? 'inset 2px 0 0 var(--accent)' : 'none',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <PriorityBar priority={ticket.priority} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontSize: '13px', fontWeight: active ? 700 : 600, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3,
          }}>
            {ticket.title}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mute)', flexShrink: 0, marginTop: '1px' }}>
            {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
          </span>
        </div>
        {ticket.description && (
          <p style={{
            fontSize: '12px', color: 'var(--mute)', margin: '0 0 6px',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.45,
          }}>
            {ticket.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <StatusChip status={ticket.status} />
          {ticket.category && (
            <span style={{ padding: '2px 6px', borderRadius: '5px', fontSize: '11px', fontWeight: 500, background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>
              {ticket.category.name}
            </span>
          )}
          {(ticket._count?.comments ?? 0) > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--mute)', marginLeft: 'auto' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            Inbox
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', margin: '2px 0 0' }}>
            {isLoading ? '…' : `${tickets.length} tickets`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', fontSize: '13px', fontWeight: 600,
            border: 0, borderRadius: '11px', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#fff', boxShadow: '0 4px 14px -4px var(--accent-glow)',
            transition: 'opacity 120ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          New ticket
        </button>
      </div>

      {/* Critical tickets */}
      <CriticalBanner />

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatChip label="Open"        value={stats.openCount}    color="oklch(0.60 0.18 220)" />
          <StatChip label="In Progress" value={stats.pendingCount} color="oklch(0.62 0.16 265)" />
          <StatChip label="Resolved"    value={stats.closedCount}  color="oklch(0.55 0.16 148)" />
          {stats.avgFirstResponseHours != null && (
            <StatChip label="Avg response" value={`${Math.round(stats.avgFirstResponseHours)}h`} color="var(--accent)" />
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Search + filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <HugeiconsIcon icon={Search01Icon} size={13} color="var(--mute)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
                fontSize: '12.5px', border: 0, borderRadius: '8px',
                background: 'var(--surface-2)', color: 'var(--ink)',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = 'inset 0 0 0 1.5px var(--accent)'; }}
              onBlur={(e)  => { (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
            />
          </div>
          <HugeiconsIcon icon={FilterIcon} size={13} color="var(--mute)" />
          <div style={{ display: 'flex', gap: '4px' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                style={{
                  padding: '5px 10px', fontSize: '12px', fontWeight: status === f.value ? 600 : 500,
                  border: 0, borderRadius: '7px', cursor: 'pointer', transition: 'all 80ms',
                  background: status === f.value ? 'var(--accent-tint)' : 'transparent',
                  color: status === f.value ? 'var(--accent)' : 'var(--ink-soft)',
                  boxShadow: status === f.value ? 'inset 0 0 0 1px var(--accent-border)' : 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '14px', width: `${55 + (i % 3) * 15}%`, borderRadius: '5px', background: 'var(--surface-2)' }} />
                <div style={{ height: '12px', width: `${70 + (i % 4) * 8}%`, borderRadius: '5px', background: 'var(--surface-2)' }} />
                <div style={{ height: '18px', width: '80px', borderRadius: '5px', background: 'var(--surface-2)' }} />
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
      </div>

      {/* Drawers */}
      <CreateTicketDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <TicketDetailDrawer ticketId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
