'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommentList } from '@/components/comments/comment-list';
import { CommentInput } from '@/components/comments/comment-input';
import { format } from 'date-fns';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'details' | 'comments';

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
  WAITING_ON_CUSTOMER: 'bg-orange-500/10 text-orange-500',
  RESOLVED: 'bg-green-500/10 text-green-500',
  CLOSED: 'bg-gray-500/10 text-gray-500',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500/10 text-gray-500',
  MEDIUM: 'bg-blue-500/10 text-blue-500',
  HIGH: 'bg-orange-500/10 text-orange-500',
  CRITICAL: 'bg-red-500/10 text-red-500',
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
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full" />
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
        <Button variant="outline" onClick={() => router.push('/tickets')}>
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
          <Badge
            variant="secondary"
            className={statusColors[ticket.status]}
          >
            {ticket.status.replace('_', ' ')}
          </Badge>
          <Badge
            variant="secondary"
            className={priorityColors[ticket.priority]}
          >
            {ticket.priority}
          </Badge>
          {ticket.category && (
            <Badge variant="outline">{ticket.category.name}</Badge>
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
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
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
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
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
                <CardHeader>
                  <CardTitle className="text-sm">Agent Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Select
                      value={ticket.status}
                      onValueChange={(v) => v && statusMutation.mutate(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING_ON_CUSTOMER">
                          Waiting on Customer
                        </SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
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
                  <Skeleton key={i} className="h-20 w-full" />
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
