'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { CommentList } from '@/components/comments/comment-list';
import { CommentInput } from '@/components/comments/comment-input';
import { format } from 'date-fns';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowRight01Icon, BubbleChatIcon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

type Tab = 'conversation' | 'details';

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  commentCount: number;
  customer: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string } | null;
  category: { id: string; name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  author: { name: string; email: string };
  createdAt: string;
}

/* ─── Status pill ─── */

const STATUS_META: Record<string, { label: string; hue: number; sat: number }> = {
  OPEN:                 { label: 'Open',               hue: 235, sat: 0.20 },
  IN_PROGRESS:          { label: 'In Progress',         hue: 50,  sat: 0.22 },
  WAITING_ON_CUSTOMER:  { label: 'Waiting on Customer', hue: 28,  sat: 0.20 },
  RESOLVED:             { label: 'Resolved',            hue: 148, sat: 0.18 },
  CLOSED:               { label: 'Closed',              hue: 270, sat: 0.10 },
};

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, hue: 270, sat: 0.08 };
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            '5px',
      padding:        '3px 9px',
      fontSize:       '11px',
      fontWeight:     600,
      letterSpacing:  '0.01em',
      borderRadius:   '6px',
      background:     `oklch(0.92 ${m.sat * 0.5} ${m.hue})`,
      color:          `oklch(0.35 ${m.sat} ${m.hue})`,
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '999px',
        background: `oklch(0.55 ${m.sat} ${m.hue})`,
        flexShrink: 0,
      }} />
      {m.label}
    </span>
  );
}

/* ─── Priority badge ─── */

const PRIORITY_META: Record<string, { label: string; hue: number }> = {
  LOW:      { label: 'Low',      hue: 148 },
  MEDIUM:   { label: 'Medium',   hue: 50  },
  HIGH:     { label: 'High',     hue: 28  },
  CRITICAL: { label: 'Critical', hue: 22  },
};

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] ?? { label: priority, hue: 270 };
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      padding:       '3px 9px',
      fontSize:      '11px',
      fontWeight:    600,
      borderRadius:  '6px',
      background:    `oklch(0.94 0.06 ${m.hue})`,
      color:         `oklch(0.38 0.16 ${m.hue})`,
    }}>
      {m.label}
    </span>
  );
}

/* ─── Side field ─── */

function SideField({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
      <div style={{ fontSize: '10px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '7px' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* ─── Avatar ─── */

function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
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
      fontSize:       `${Math.max(10, size * 0.38)}px`,
      fontWeight:     600,
      flexShrink:     0,
    }}>
      {initials}
    </div>
  );
}

/* ─── Status picker ─── */

const STATUS_OPTS = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;

function StatusPicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {STATUS_OPTS.map((s) => {
        const m = STATUS_META[s];
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => !disabled && onChange(s)}
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '8px',
              padding:       '6px 10px',
              borderRadius:  '7px',
              border:        active ? `1px solid oklch(0.82 0.06 ${m.hue})` : '1px solid transparent',
              background:    active ? `oklch(0.94 0.04 ${m.hue})` : 'transparent',
              cursor:        disabled ? 'not-allowed' : 'pointer',
              textAlign:     'left',
              transition:    'all 80ms',
              opacity:       disabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span style={{
              width: '7px', height: '7px', borderRadius: '999px', flexShrink: 0,
              background: `oklch(0.55 0.16 ${m.hue})`,
            }} />
            <span style={{ fontSize: '12px', fontWeight: active ? 600 : 500, color: active ? `oklch(0.32 0.14 ${m.hue})` : 'var(--ink-soft)' }}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Page ─── */

export default function TicketDetailPage() {
  const params       = useParams();
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const socket       = useSocket();
  const user         = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('conversation');

  const isAgent =
    user?.role === Role.AGENT ||
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN;

  const ticketId = params.id as string;

  const { data: ticketRes, isLoading: ticketLoading, error: ticketError } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn:  () => apiClient<{ data: TicketDetail }>(`/tickets/${ticketId}`),
    enabled:  !!ticketId,
  });

  const { data: commentsRes, isLoading: commentsLoading } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn:  () => apiClient<{ data: Comment[] }>(`/tickets/${ticketId}/comments`),
    enabled:  !!ticketId,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      apiClient(`/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const queryComments = commentsRes?.data ?? [];
  const comments = liveComments.length > 0 ? liveComments : queryComments;

  const handleNewComment = useCallback((comment: Comment) => {
    setLiveComments((prev) => [comment, ...prev]);
  }, []);

  useEffect(() => {
    if (!socket || !ticketId) return;
    socket.emit('join:ticket', ticketId);
    socket.on('comment:created', handleNewComment);
    return () => {
      socket.off('comment:created', handleNewComment);
      socket.emit('leave:ticket', ticketId);
    };
  }, [socket, ticketId, handleNewComment]);

  const ticket = ticketRes?.data;

  /* ─── Loading ─── */
  if (ticketLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[280, 440, 180, 320].map((w, i) => (
          <div key={i} style={{ height: '18px', width: `${w}px`, maxWidth: '100%', background: 'var(--surface-2)', borderRadius: '7px' }} />
        ))}
      </div>
    );
  }

  /* ─── Error ─── */
  if (ticketError || !ticket) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '80px 0' }}>
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'oklch(0.50 0.20 22)', margin: 0 }}>Failed to load ticket</p>
        <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>The ticket may not exist or you may not have access.</p>
        <button
          onClick={() => router.push('/tickets')}
          style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: 0,
            borderRadius: '9px', background: 'var(--surface-2)', color: 'var(--ink-soft)',
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
          }}
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: IconSvgElement }[] = [
    { key: 'conversation', label: `Conversation (${ticket.commentCount ?? comments.length})`, icon: BubbleChatIcon          },
    { key: 'details',      label: 'Details',                                                    icon: InformationCircleIcon  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)' }}>
        <button
          onClick={() => router.push('/tickets')}
          style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: '12px', padding: 0, transition: 'color 100ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--mute)'; }}
        >
          Tickets
        </button>
        <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 500 }}>{ticketId}</span>
      </div>

      {/* Title + badges */}
      <div>
        <h1 style={{
          fontSize:      '24px',
          fontFamily:    'var(--font-display)',
          fontWeight:    400,
          color:         'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight:    1.2,
          margin:        '0 0 10px',
        }}>
          {ticket.title}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <StatusPill status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.category && (
            <span style={{
              padding: '3px 9px', fontSize: '11px', fontWeight: 500,
              borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--ink-soft)',
            }}>
              {ticket.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--hairline)' }}>
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           '6px',
                padding:       '8px 14px',
                fontSize:      '13px',
                fontWeight:    active ? 600 : 500,
                border:        0,
                borderBottom:  active ? '2px solid var(--accent)' : '2px solid transparent',
                background:    'transparent',
                color:         active ? 'var(--accent)' : 'var(--mute)',
                cursor:        'pointer',
                marginBottom:  '-1px',
                transition:    'all 100ms',
              }}
            >
              <HugeiconsIcon icon={t.icon} size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        {/* Left: tab content */}
        <div>
          {activeTab === 'conversation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-live="polite">
              <div style={{
                background: 'var(--surface)', borderRadius: '14px',
                boxShadow: 'var(--shadow-sm)', padding: '16px',
              }}>
                <CommentInput ticketId={ticketId} showInternal={isAgent} />
              </div>
              <div>
                {commentsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[1,2,3].map((i) => (
                      <div key={i} style={{ height: '80px', background: 'var(--surface-2)', borderRadius: '10px' }} />
                    ))}
                  </div>
                ) : (
                  <CommentList comments={comments} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div style={{
              background:   'var(--surface)',
              borderRadius: '14px',
              boxShadow:    'var(--shadow-sm)',
              padding:      '20px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Description
              </div>
              {ticket.description ? (
                <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {ticket.description}
                </p>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--mute)', fontStyle: 'italic', margin: 0 }}>
                  No description provided
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: side rail */}
        <div style={{
          background:   'var(--surface)',
          borderRadius: '14px',
          boxShadow:    'var(--shadow-sm)',
          overflow:     'hidden',
        }}>
          <SideField label="Status">
            {isAgent ? (
              <StatusPicker
                value={ticket.status}
                onChange={(v) => statusMutation.mutate(v)}
                disabled={statusMutation.isPending}
              />
            ) : (
              <StatusPill status={ticket.status} />
            )}
          </SideField>

          <SideField label="Customer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar name={ticket.customer?.name || 'U'} size={26} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)' }}>{ticket.customer?.name || '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--mute)' }}>{ticket.customer?.email || ''}</div>
              </div>
            </div>
          </SideField>

          <SideField label="Assignee">
            {ticket.assignedTo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar name={ticket.assignedTo.name} size={26} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink)' }}>{ticket.assignedTo.name}</span>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--mute)', fontStyle: 'italic' }}>Unassigned</span>
            )}
          </SideField>

          <SideField label="Priority">
            <PriorityBadge priority={ticket.priority} />
          </SideField>

          {ticket.category && (
            <SideField label="Category">
              <span style={{
                padding: '3px 9px', fontSize: '11px', fontWeight: 500,
                borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--ink-soft)',
              }}>
                {ticket.category.name}
              </span>
            </SideField>
          )}

          <SideField label="Created">
            <span style={{ fontSize: '12px', color: 'var(--ink)' }}>
              {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
            </span>
          </SideField>

          <SideField label="Updated" last>
            <span style={{ fontSize: '12px', color: 'var(--ink)' }}>
              {format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}
            </span>
          </SideField>
        </div>
      </div>
    </div>
  );
}
