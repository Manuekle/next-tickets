'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { Button, Chip, Skeleton, Card, CardHeader, CardContent } from '@heroui/react';
import {
  Select, SelectTrigger, SelectValue, SelectPopover, ListBox, ListBoxItem,
} from '@heroui/react';
import { CommentList } from '@/components/comments/comment-list';
import { CommentInput } from '@/components/comments/comment-input';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'details' | 'comments';

const statusColors: Record<string, string> = {
  OPEN: 'accent',
  IN_PROGRESS: 'warning',
  WAITING_ON_CUSTOMER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const priorityColors: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'accent',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

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

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  const isAgent =
    user?.role === Role.AGENT ||
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN;
  const ticketId = params.id as string;

  const {
    data: ticketRes,
    isLoading: ticketLoading,
    error: ticketError,
  } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () =>
      apiClient<{ data: TicketDetail }>(`/tickets/${ticketId}`),
    enabled: !!ticketId,
  });

  const {
    data: commentsRes,
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () =>
      apiClient<{ data: Comment[] }>(`/tickets/${ticketId}/comments`),
    enabled: !!ticketId,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      apiClient(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const [liveComments, setLiveComments] = useState<Comment[]>([]);
  const queryComments = commentsRes?.data ?? [];

  const comments =
    liveComments.length > 0
      ? liveComments
      : queryComments;

  const handleNewComment = useCallback(
    (comment: Comment) => {
      setLiveComments((prev) => [comment, ...prev]);
    },
    [],
  );

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

  if (ticketLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-destructive">Failed to load ticket</p>
        <p className="text-sm text-muted-foreground">
          The ticket may not exist or you may not have access.
        </p>
        <Button variant="secondary" onClick={() => router.push('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'comments', label: `Comments (${ticket.commentCount ?? comments.length})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => router.push('/tickets')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Tickets
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ticket.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip color={statusColors[ticket.status] as any} variant="soft" size="sm">
            {ticket.status.replace('_', ' ')}
          </Chip>
          <Chip color={priorityColors[ticket.priority] as any} variant="soft" size="sm">
            {ticket.priority}
          </Chip>
          {ticket.category && (
            <Chip variant="secondary" size="sm">{ticket.category.name}</Chip>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b" role="tablist" aria-label="Ticket sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.key === 'comments' && (
              <MessageSquare className="-ml-1 mr-1 inline h-4 w-4" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Card>
              <CardHeader><p className="text-sm font-medium">Description</p></CardHeader>
              <CardContent>
                {ticket.description ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><p className="text-sm font-medium">Details</p></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">
                    {ticket.customer?.name || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.customer?.email || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-medium">
                    {ticket.assignedTo?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-sm">
                    {format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {isAgent && (
              <Card>
                <CardHeader><p className="text-sm font-medium">Agent Actions</p></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Select
                      selectedKey={ticket.status}
                      onSelectionChange={(keys) => {
                        const v = String(keys);
                        if (v) statusMutation.mutate(v);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectPopover>
                        <ListBox>
                          <ListBoxItem id="OPEN">Open</ListBoxItem>
                          <ListBoxItem id="IN_PROGRESS">In Progress</ListBoxItem>
                          <ListBoxItem id="WAITING_ON_CUSTOMER">Waiting on Customer</ListBoxItem>
                          <ListBoxItem id="RESOLVED">Resolved</ListBoxItem>
                          <ListBoxItem id="CLOSED">Closed</ListBoxItem>
                        </ListBox>
                      </SelectPopover>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="max-w-2xl space-y-4" aria-live="polite">
          <CommentInput ticketId={ticketId} showInternal={isAgent} />

          <div className="pt-2">
            {commentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <CommentList comments={comments} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
