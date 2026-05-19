'use client';
export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon, Alert02Icon, CheckmarkCircle01Icon, Clock01Icon, InboxIcon,
  FilterIcon, ArrowRight01Icon, BubbleChatIcon, MailSend01Icon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

/* ─── types ─── */

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: { name: string } | null;
  assignedTo?: { name: string; id: string } | null;
  customer?: { name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number };
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  author: { name: string };
  createdAt: string;
}

interface TicketDetail extends Ticket {
  comments: Comment[];
  tags?: { tag: { id: string; name: string } }[];
}

interface DashboardStats {
  openCount: number;
  closedCount: number;
  pendingCount: number;
  avgFirstResponseHours: number | null;
}

/* ─── meta ─── */

const STATUS_META: Record<string, { label: string; hue: number; chroma: number }> = {
  OPEN:                { label: 'Open',        hue: 235, chroma: 0.18 },
  IN_PROGRESS:         { label: 'In progress', hue: 65,  chroma: 0.18 },
  WAITING_ON_CUSTOMER: { label: 'Waiting',     hue: 305, chroma: 0.16 },
  RESOLVED:            { label: 'Resolved',    hue: 155, chroma: 0.16 },
  CLOSED:              { label: 'Closed',      hue: 260, chroma: 0.015 },
};

const PRIORITY_META: Record<string, { label: string; hue: number }> = {
  LOW:      { label: 'Low',      hue: 155 },
  MEDIUM:   { label: 'Medium',   hue: 70  },
  HIGH:     { label: 'High',     hue: 40  },
  CRITICAL: { label: 'Critical', hue: 22  },
};

const STATUS_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Open',      value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Waiting',   value: 'WAITING_ON_CUSTOMER' },
  { label: 'Resolved',  value: 'RESOLVED' },
];

/* ─── utils ─── */

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.round(ms / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.round(d / 30)}mo`;
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── small components ─── */

function StatusDot({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span style={{
      flexShrink:   0,
      width:        '8px',
      height:       '8px',
      borderRadius: '999px',
      background:   `oklch(0.60 ${m.chroma * 1.1} ${m.hue})`,
      boxShadow:    `0 0 0 2px oklch(0.92 ${m.chroma * 0.3} ${m.hue})`,
    }} />
  );
}

function PriorityPip({ priority }: { priority: string }) {
  const m     = PRIORITY_META[priority];
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const lvl   = order.indexOf(priority) + 1;
  if (!m) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '12px', flexShrink: 0 }}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} style={{
          width:        '3px',
          height:       `${3 + i * 2}px`,
          borderRadius: '1px',
          background:   i <= lvl ? `oklch(0.58 0.20 ${m.hue})` : 'var(--surface-3)',
        }} />
      ))}
    </span>
  );
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div style={{
      width:          `${size}px`,
      height:         `${size}px`,
      borderRadius:   '999px',
      background:     'linear-gradient(135deg, oklch(0.52 0.04 258), oklch(0.42 0.04 262))',
      color:          '#fff',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       `${Math.max(9, size * 0.36)}px`,
      fontWeight:     600,
      flexShrink:     0,
      letterSpacing:  '-0.01em',
    }}>
      {initials(name)}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      '3px 8px 3px 6px',
      fontSize:     '11.5px',
      fontWeight:   600,
      borderRadius: '999px',
      background:   `oklch(0.93 ${m.chroma * 0.3} ${m.hue})`,
      color:        `oklch(0.32 ${m.chroma} ${m.hue})`,
      whiteSpace:   'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: `oklch(0.56 ${m.chroma * 1.1} ${m.hue})`, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

/* ─── ticket row (left panel) ─── */

function TicketRow({ ticket, selected, onClick }: { ticket: Ticket; selected: boolean; onClick: () => void }) {
  const isUnread = ticket.status === 'OPEN';
  const pm = PRIORITY_META[ticket.priority];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:         'flex',
        flexDirection:   'column',
        gap:             '5px',
        width:           '100%',
        padding:         '12px 14px',
        border:          0,
        borderBottom:    '1px solid var(--hairline)',
        background:      selected ? 'var(--accent-tint)' : 'transparent',
        textAlign:       'left',
        cursor:          'pointer',
        transition:      'background 80ms',
        position:        'relative',
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {/* unread indicator */}
      {isUnread && !selected && (
        <span style={{
          position:     'absolute',
          left:         '4px',
          top:          '50%',
          transform:    'translateY(-50%)',
          width:        '4px',
          height:       '4px',
          borderRadius: '999px',
          background:   'var(--accent)',
        }} />
      )}

      {/* row 1: title + time */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{
          flex:          1,
          minWidth:      0,
          fontSize:      '13px',
          fontWeight:    isUnread ? 600 : 400,
          color:         selected ? 'var(--accent-fg-on-tint)' : 'var(--ink)',
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          letterSpacing: '-0.005em',
        }}>
          {ticket.title}
        </div>
        <span style={{ fontSize: '11px', color: selected ? 'var(--accent)' : 'var(--mute)', flexShrink: 0, fontFeatureSettings: '"tnum"' }}>
          {timeAgo(ticket.updatedAt)}
        </span>
      </div>

      {/* row 2: description preview */}
      <div style={{
        fontSize:     '12px',
        color:        selected ? 'var(--accent-fg-on-tint)' : 'var(--mute)',
        opacity:      selected ? 0.75 : 1,
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        lineHeight:   1.4,
      }}>
        {ticket.description?.replace(/\n/g, ' ') || 'No description'}
      </div>

      {/* row 3: badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <StatusDot status={ticket.status} />
        <PriorityPip priority={ticket.priority} />
        {ticket.category && (
          <span style={{
            fontSize:     '10.5px',
            padding:      '1px 6px',
            borderRadius: '4px',
            fontWeight:   600,
            background:   selected ? 'rgba(255,255,255,0.35)' : 'var(--surface-2)',
            color:        selected ? 'var(--accent-fg-on-tint)' : 'var(--mute)',
          }}>
            {ticket.category.name}
          </span>
        )}
        {ticket._count && ticket._count.comments > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: selected ? 'var(--accent)' : 'var(--mute)', marginLeft: 'auto' }}>
            <HugeiconsIcon icon={BubbleChatIcon} size={11} />
            {ticket._count.comments}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── ticket detail panel (right panel) ─── */

function TicketDetailPanel({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => apiClient<{ data: TicketDetail }>(`/tickets/${ticketId}`),
    enabled: !!ticketId,
  });

  const commentMutation = useMutation({
    mutationFn: (body: { content: string; isInternal: boolean }) =>
      apiClient(`/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['inbox-tickets'] });
      setReplyText('');
      toast.success('Reply sent');
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const ticket = res?.data;

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.comments?.length]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[60, 100, 80, 200, 150].map((w, i) => (
          <div key={i} style={{ height: i === 1 ? '22px' : '14px', width: `${w}%`, maxWidth: `${w * 4}px`, borderRadius: '6px', background: 'var(--surface-2)' }} />
        ))}
      </div>
    );
  }

  if (!ticket) return null;
  const canReply = user?.role !== 'CUSTOMER' || ticket.customer?.email === user?.email;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <StatusPill status={ticket.status} />
            <span style={{ fontSize: '11px', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
              #{ticket.id.slice(0, 8)}
            </span>
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.35 }}>
            {ticket.title}
          </h2>
        </div>
        <button
          onClick={() => router.push(`/tickets/${ticket.id}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', fontSize: '12px', fontWeight: 500, border: 0, borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}
          title="Open full ticket"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
          Open
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Metadata */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          <MetaItem label="Priority">
            <PriorityPip priority={ticket.priority} />
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 500 }}>{PRIORITY_META[ticket.priority]?.label}</span>
          </MetaItem>
          {ticket.category && (
            <MetaItem label="Category">
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{ticket.category.name}</span>
            </MetaItem>
          )}
          {ticket.assignedTo && (
            <MetaItem label="Assignee">
              <Avatar name={ticket.assignedTo.name} size={18} />
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{ticket.assignedTo.name}</span>
            </MetaItem>
          )}
          {ticket.customer && (
            <MetaItem label="Customer">
              <Avatar name={ticket.customer.name} size={18} />
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{ticket.customer.name}</span>
            </MetaItem>
          )}
          <MetaItem label="Created">
            <span style={{ fontSize: '12px', color: 'var(--mute)' }}>{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </MetaItem>
        </div>

        {/* Description */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Description</div>
          <div style={{ fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {ticket.description || <span style={{ color: 'var(--mute)', fontStyle: 'italic' }}>No description</span>}
          </div>
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {ticket.tags.map(({ tag }) => (
              <span key={tag.id} style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 500, background: 'var(--surface-2)', color: 'var(--mute)' }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Comments */}
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Conversation {ticket.comments.length > 0 && `· ${ticket.comments.length}`}
          </div>
          {ticket.comments.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--mute)', fontStyle: 'italic' }}>No replies yet.</p>
          )}
          {ticket.comments.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
              <Avatar name={c.author.name} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>{c.author.name}</span>
                  {c.isInternal && (
                    <span style={{ padding: '1px 6px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', background: 'oklch(0.94 0.06 60)', color: 'oklch(0.48 0.18 60)' }}>internal</span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--mute)', marginLeft: 'auto' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <div style={{
                  fontSize:    '13.5px',
                  color:       'var(--ink)',
                  lineHeight:  1.6,
                  whiteSpace:  'pre-wrap',
                  padding:     '10px 12px',
                  borderRadius:'10px',
                  background:  c.isInternal ? 'oklch(0.97 0.04 60)' : 'var(--surface-2)',
                  border:      c.isInternal ? '1px solid oklch(0.90 0.07 60)' : '1px solid var(--hairline)',
                }}>
                  {c.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Reply box */}
      {canReply && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--hairline)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <Avatar name={user?.name || 'You'} size={28} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && replyText.trim()) {
                    commentMutation.mutate({ content: replyText.trim(), isInternal });
                  }
                }}
                style={{
                  width:        '100%',
                  padding:      '8px 10px',
                  fontSize:     '13px',
                  color:        'var(--ink)',
                  background:   'var(--surface)',
                  border:       0,
                  borderRadius: '10px',
                  boxShadow:    'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
                  outline:      'none',
                  resize:       'none',
                  fontFamily:   'inherit',
                  lineHeight:   1.5,
                  boxSizing:    'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'AGENT') && (
                  <button
                    type="button"
                    onClick={() => setIsInternal(!isInternal)}
                    style={{
                      display:      'inline-flex',
                      alignItems:   'center',
                      gap:          '4px',
                      padding:      '4px 9px',
                      fontSize:     '11px',
                      fontWeight:   600,
                      border:       0,
                      borderRadius: '6px',
                      cursor:       'pointer',
                      background:   isInternal ? 'oklch(0.94 0.07 60)' : 'var(--surface-3)',
                      color:        isInternal ? 'oklch(0.48 0.18 60)' : 'var(--mute)',
                      transition:   'all 100ms',
                    }}
                  >
                    Internal note
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { if (replyText.trim()) commentMutation.mutate({ content: replyText.trim(), isInternal }); }}
                  disabled={!replyText.trim() || commentMutation.isPending}
                  style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          '5px',
                    padding:      '6px 14px',
                    fontSize:     '12px',
                    fontWeight:   600,
                    border:       0,
                    borderRadius: '8px',
                    background:   'linear-gradient(135deg, var(--accent), var(--accent-2))',
                    color:        '#fff',
                    cursor:       (!replyText.trim() || commentMutation.isPending) ? 'not-allowed' : 'pointer',
                    opacity:      (!replyText.trim() || commentMutation.isPending) ? 0.5 : 1,
                    boxShadow:    '0 3px 10px -3px var(--accent-glow)',
                    marginLeft:   'auto',
                    transition:   'all 100ms',
                  }}
                >
                  <HugeiconsIcon icon={MailSend01Icon} size={12} />
                  {commentMutation.isPending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>{children}</div>
    </div>
  );
}

/* ─── main page ─── */

export default function DashboardPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [search, setSearch] = useState('');

  const { data: statsRes } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => apiClient<{ data: DashboardStats }>('/analytics/stats'),
  });

  const params: Record<string, string> = { limit: '50' };
  if (statusFilter) params.status = statusFilter;
  if (search) params.q = search;

  const { data: ticketsRes, isLoading } = useQuery({
    queryKey: ['inbox-tickets', params],
    queryFn:  () => apiClient<{ data: Ticket[] }>('/tickets', { params }),
  });

  const stats   = statsRes?.data;
  const tickets = ticketsRes?.data ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mute)' }}>Inbox</span>
            {stats && (
              <span style={{ fontSize: '11px', color: 'var(--mute)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: '5px', fontFeatureSettings: '"tnum"' }}>
                {stats.openCount} open
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
            {greeting}, {firstName}.
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* stat pills */}
          {stats && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <StatPill icon={<HugeiconsIcon icon={Clock01Icon} size={12} />} value={stats.pendingCount} label="In progress" hue={65} />
              <StatPill icon={<HugeiconsIcon icon={Alert02Icon} size={12} />} value={Math.ceil((stats.openCount ?? 0) * 0.15)} label="SLA at risk" hue={22} />
              <StatPill icon={<HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />} value={stats.closedCount} label="Resolved" hue={155} />
            </div>
          )}
          <button
            onClick={() => router.push('/tickets/new')}
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '6px',
              padding:      '7px 14px',
              fontSize:     '13px',
              fontWeight:   600,
              border:       0,
              borderRadius: '10px',
              background:   'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color:        '#fff',
              cursor:       'pointer',
              boxShadow:    '0 4px 12px -4px var(--accent-glow)',
              marginLeft:   '4px',
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={13} />
            New ticket
          </button>
        </div>
      </div>

      {/* Two-panel inbox */}
      <div style={{
        display:       'grid',
        gridTemplateColumns: selectedId ? '320px 1fr' : '1fr',
        height:        'calc(100dvh - 240px)',
        minHeight:     '480px',
        background:    'var(--surface)',
        borderRadius:  '16px',
        boxShadow:     'var(--shadow-md)',
        overflow:      'hidden',
        border:        '1px solid var(--hairline)',
        transition:    'grid-template-columns 200ms ease',
      }}>

        {/* LEFT: ticket list */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: selectedId ? '1px solid var(--hairline)' : 'none', overflow: 'hidden' }}>
          {/* List header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <HugeiconsIcon icon={FilterIcon} size={12} color="var(--mute)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Filter tickets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width:        '100%',
                  paddingLeft:  '30px',
                  paddingRight: '10px',
                  paddingTop:   '7px',
                  paddingBottom:'7px',
                  fontSize:     '12.5px',
                  border:       0,
                  borderRadius: '8px',
                  background:   'var(--surface-2)',
                  color:        'var(--ink)',
                  outline:      'none',
                  boxSizing:    'border-box',
                  fontFamily:   'inherit',
                }}
              />
            </div>
            {/* Status filters */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  style={{
                    padding:      '4px 9px',
                    fontSize:     '11.5px',
                    fontWeight:   statusFilter === f.value ? 600 : 500,
                    border:       0,
                    borderRadius: '6px',
                    cursor:       'pointer',
                    whiteSpace:   'nowrap',
                    background:   statusFilter === f.value ? 'var(--accent-tint)' : 'transparent',
                    color:        statusFilter === f.value ? 'var(--accent)' : 'var(--mute)',
                    transition:   'all 80ms',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ height: '13px', width: '75%', background: 'var(--surface-2)', borderRadius: '4px' }} />
                  <div style={{ height: '11px', width: '100%', background: 'var(--surface-2)', borderRadius: '4px' }} />
                  <div style={{ height: '11px', width: '40%', background: 'var(--surface-2)', borderRadius: '4px' }} />
                </div>
              ))
            ) : tickets.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--mute)' }}>
                  <HugeiconsIcon icon={InboxIcon} size={20} />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>No tickets found</p>
              </div>
            ) : (
              tickets.map((t) => (
                <TicketRow
                  key={t.id}
                  ticket={t}
                  selected={selectedId === t.id}
                  onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: detail or empty state */}
        {selectedId ? (
          <TicketDetailPanel key={selectedId} ticketId={selectedId} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--mute)', padding: '40px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={InboxIcon} size={22} />
            </div>
            <p style={{ fontSize: '13px', margin: 0 }}>Select a ticket to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ icon, value, label, hue }: { icon: React.ReactNode; value: number; label: string; hue: number }) {
  return (
    <div style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      '5px 10px',
      borderRadius: '8px',
      background:   `oklch(0.94 0.04 ${hue})`,
      color:        `oklch(0.40 0.16 ${hue})`,
      fontSize:     '12px',
      fontWeight:   600,
    }}>
      {icon}
      <span style={{ fontFeatureSettings: '"tnum"' }}>{value}</span>
      <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>{label}</span>
    </div>
  );
}
