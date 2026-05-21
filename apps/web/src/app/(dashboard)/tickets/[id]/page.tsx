'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSocket } from '@/components/providers/socket-provider';
import { useSocketEvent, useTicketRoom } from '@/hooks/use-socket-event';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { CommentList } from '@/components/comments/comment-list';
import { CommentInput } from '@/components/comments/comment-input';
import { CopilotPanel } from '@/components/ai/copilot-panel';
import { ActivityTimeline } from '@/components/tickets/activity-timeline';
import { format } from 'date-fns';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowRight01Icon, BubbleChatIcon, InformationCircleIcon, Activity01Icon } from '@hugeicons/core-free-icons';
import { sileo } from 'sileo';
import { Badge, categoryVariant, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Tab = 'conversation' | 'details' | 'activity';

interface ActivityLog {
  id: string;
  action: string;
  details?: Record<string, unknown> | null;
  user: { id: string; name: string } | null;
  createdAt: string;
}

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
  activityLogs?: ActivityLog[];
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

/* ─── status / priority maps ─── */

const STATUS_META: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  OPEN:                 { label: 'Open',                variant: 'info'    },
  IN_PROGRESS:          { label: 'In Progress',         variant: 'warning' },
  WAITING_ON_CUSTOMER:  { label: 'Waiting on Customer', variant: 'neutral' },
  RESOLVED:             { label: 'Resolved',            variant: 'success' },
  CLOSED:               { label: 'Closed',              variant: 'neutral' },
};

const PRIORITY_META: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  LOW:      { label: 'Low',      variant: 'info'    },
  MEDIUM:   { label: 'Medium',   variant: 'neutral' },
  HIGH:     { label: 'High',     variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'danger'  },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, variant: 'neutral' as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] ?? { label: priority, variant: 'neutral' as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

/* ─── Side field ─── */

function SideField({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn('px-[18px] py-3.5', !last && 'border-b border-border')}>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-mute">{label}</div>
      {children}
    </div>
  );
}

/* ─── Status picker ─── */

const STATUS_OPTS = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;

function StatusPicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      {STATUS_OPTS.map((s) => {
        const m = STATUS_META[s];
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => !disabled && onChange(s)}
            disabled={disabled}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
              active
                ? 'border-border-strong bg-surface-2 font-semibold text-ink'
                : 'border-transparent font-medium text-ink-soft hover:bg-surface-2',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {m.label}
            {active && <Badge variant={m.variant}>Current</Badge>}
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
      sileo.success({ title: 'Status updated' });
    },
    onError: () => sileo.error({ title: 'Failed to update status' }),
  });

  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const queryComments = commentsRes?.data ?? [];
  const comments = liveComments.length > 0 ? liveComments : queryComments;

  const handleNewComment = useCallback((comment: Comment) => {
    setLiveComments((prev) => [comment, ...prev]);
  }, []);

  useTicketRoom(socket, ticketId);
  useSocketEvent<Comment>(socket, 'comment:created', handleNewComment, [handleNewComment]);

  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const handleTyping = useCallback((data: { userId: string; name?: string; typing: boolean }) => {
    if (!data?.userId || data.userId === user?.id) return;
    setTypingUsers((prev) => {
      const next = { ...prev };
      if (data.typing) next[data.userId] = data.name ?? 'Someone';
      else delete next[data.userId];
      return next;
    });
  }, [user?.id]);
  useSocketEvent<{ userId: string; name?: string; typing: boolean }>(socket, 'typing:status', handleTyping, [handleTyping]);

  const typingNames = Object.values(typingUsers);

  const ticket = ticketRes?.data;

  /* ─── Loading ─── */
  if (ticketLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[280, 440, 180, 320].map((w, i) => (
          <div key={i} className="h-[18px] max-w-full rounded-md bg-surface-2" style={{ width: `${w}px` }} />
        ))}
      </div>
    );
  }

  /* ─── Error ─── */
  if (ticketError || !ticket) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="m-0 text-[15px] font-medium text-danger">Failed to load ticket</p>
        <p className="m-0 text-[13px] text-mute">The ticket may not exist or you may not have access.</p>
        <Button variant="secondary" onClick={() => router.push('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: IconSvgElement }[] = [
    { key: 'conversation', label: `Conversation (${ticket.commentCount ?? comments.length})`, icon: BubbleChatIcon          },
    { key: 'details',      label: 'Details',                                                    icon: InformationCircleIcon  },
    { key: 'activity',     label: `Activity (${ticket.activityLogs?.length ?? 0})`,             icon: Activity01Icon         },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-mute">
        <button
          onClick={() => router.push('/tickets')}
          className="p-0 text-mute transition-colors hover:text-ink"
        >
          Tickets
        </button>
        <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
        <span className="font-mono font-medium text-ink">{ticketId}</span>
      </div>

      {/* Title + badges */}
      <div>
        <h1 className="mb-2.5 text-ink">{ticket.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.category && <Badge variant={categoryVariant(ticket.category.name)}>{ticket.category.name}</Badge>}
        </div>
      </div>

      {/* Tab bar */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as Tab)}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTab key={t.key} value={t.key} className="flex items-center gap-1.5">
              <HugeiconsIcon icon={t.icon} size={13} />
              {t.label}
            </TabsTab>
          ))}
        </TabsList>

        {/* Main content */}
        <div className="mt-5 grid grid-cols-[1fr_280px] items-start gap-5">
          {/* Left: tab content */}
          <div>
            <TabsPanel value="conversation">
              <div className="flex flex-col gap-4" aria-live="polite">
                <Card className="p-4">
                  <CommentInput ticketId={ticketId} showInternal={isAgent} />
                  {typingNames.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[11.5px] italic text-mute">
                      <span className="inline-flex gap-0.5" aria-hidden>
                        <span className="nt-typing-dot" />
                        <span className="nt-typing-dot" style={{ animationDelay: '0.15s' }} />
                        <span className="nt-typing-dot" style={{ animationDelay: '0.30s' }} />
                      </span>
                      {typingNames.length === 1
                        ? `${typingNames[0]} is typing…`
                        : `${typingNames.length} people are typing…`}
                    </div>
                  )}
                </Card>
                <div>
                  {commentsLoading ? (
                    <div className="flex flex-col gap-2.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-lg bg-surface-2" />
                      ))}
                    </div>
                  ) : (
                    <CommentList comments={comments} />
                  )}
                </div>
              </div>
            </TabsPanel>

            <TabsPanel value="details">
              <Card className="p-5">
                <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-mute">
                  Description
                </div>
                {ticket.description ? (
                  <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {ticket.description}
                  </p>
                ) : (
                  <p className="m-0 text-[13px] italic text-mute">No description provided</p>
                )}
              </Card>
            </TabsPanel>

            <TabsPanel value="activity">
              <ActivityTimeline logs={ticket.activityLogs ?? []} />
            </TabsPanel>
          </div>

          {/* Right: side rail */}
          <Card className="overflow-hidden">
            <SideField label="Status">
              {isAgent ? (
                <StatusPicker
                  value={ticket.status}
                  onChange={(v) => statusMutation.mutate(v)}
                  disabled={statusMutation.isPending}
                />
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </SideField>

            <SideField label="Customer">
              <div className="flex items-center gap-2">
                <Avatar name={ticket.customer?.name || 'U'} size={26} />
                <div>
                  <div className="text-xs font-medium text-ink">{ticket.customer?.name || '—'}</div>
                  <div className="text-[11px] text-mute">{ticket.customer?.email || ''}</div>
                </div>
              </div>
            </SideField>

            <SideField label="Assignee">
              {ticket.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar name={ticket.assignedTo.name} size={26} />
                  <span className="text-xs font-medium text-ink">{ticket.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-xs italic text-mute">Unassigned</span>
              )}
            </SideField>

            <SideField label="Priority">
              <PriorityBadge priority={ticket.priority} />
            </SideField>

            {ticket.category && (
              <SideField label="Category">
                <Badge variant={categoryVariant(ticket.category.name)}>{ticket.category.name}</Badge>
              </SideField>
            )}

            <SideField label="Created">
              <span className="text-xs text-ink">
                {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
            </SideField>

            <SideField label="Updated" last>
              <span className="text-xs text-ink">
                {format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}
              </span>
            </SideField>

            {isAgent && <CopilotPanel ticketId={ticketId} />}
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
