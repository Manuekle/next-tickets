'use client';

import { useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon, Add01Icon, BubbleChatIcon, MailSend01Icon,
  Alert02Icon, CheckmarkCircle01Icon, Clock01Icon,
} from '@hugeicons/core-free-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { formatDistanceToNow } from 'date-fns';
import {
  Drawer, DrawerContent, DrawerTitle, DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* ─── shared types ─── */
interface Category { id: string; name: string }

interface Comment {
  id: string; content: string; isInternal: boolean;
  author: { name: string }; createdAt: string;
}

interface TicketDetail {
  id: string; title: string; description: string; status: string; priority: string;
  category?: Category | null;
  assignedTo?: { name: string } | null;
  customer?: { name: string; email: string } | null;
  createdAt: string;
  tags?: { tag: { id: string; name: string } }[];
  comments: Comment[];
}

/* ─── priority / status helpers ─── */
const PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  CRITICAL: 'danger',
  HIGH:     'warning',
  MEDIUM:   'neutral',
  LOW:      'info',
};
const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  OPEN:                  'info',
  IN_PROGRESS:           'warning',
  WAITING_ON_CUSTOMER:   'neutral',
  RESOLVED:              'success',
  CLOSED:                'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress',
  WAITING_ON_CUSTOMER: 'Waiting', RESOLVED: 'Resolved', CLOSED: 'Closed',
};
const STATUS_ICON: Record<string, typeof Alert02Icon> = {
  OPEN: Alert02Icon, IN_PROGRESS: Clock01Icon,
  WAITING_ON_CUSTOMER: Clock01Icon, RESOLVED: CheckmarkCircle01Icon, CLOSED: CheckmarkCircle01Icon,
};

/* ─── Drawer shell ─── */
function DrawerShell({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent side="right" className="max-w-[560px]">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Close drawer">
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
              </Button>
            }
          />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── CREATE TICKET DRAWER ─── */
interface CreateTicketDrawerProps { open: boolean; onClose: () => void }

export function CreateTicketDrawer({ open, onClose }: CreateTicketDrawerProps) {
  const qc = useQueryClient();
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState('MEDIUM');
  const [categoryId, setCategoryId] = useState('');

  const { data: catsRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<{ data: Category[] }>('/categories'),
    enabled: open,
  });
  const categories = catsRes?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => apiClient('/tickets', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, priority, categoryId: categoryId || undefined }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-tickets'] });
      sileo.success({ title: 'Ticket created' });
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setCategoryId('');
      onClose();
    },
    onError: () => sileo.error({ title: 'Failed to create ticket' }),
  });

  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <DrawerShell open={open} onClose={onClose} title="New ticket">
      <div className="flex flex-col gap-4 p-5">
        {/* Title */}
        <div>
          <Label className="mb-1.5 block">
            Title <span className="text-danger">*</span>
          </Label>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short description of the issue"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="mb-1.5 block">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more context…"
            rows={4}
          />
        </div>

        {/* Priority */}
        <div>
          <Label className="mb-2 block">Priority</Label>
          <div className="flex gap-1.5">
            {priorities.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={priority === p ? 'primary' : 'outline'}
                className="flex-1"
                onClick={() => setPriority(p)}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <Label className="mb-1.5 block">Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          className="mt-1 w-full"
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          {mutation.isPending ? 'Creating…' : 'Create ticket'}
        </Button>
      </div>
    </DrawerShell>
  );
}

/* ─── TICKET DETAIL DRAWER ─── */
interface TicketDetailDrawerProps { ticketId: string | null; onClose: () => void }

export function TicketDetailDrawer({ ticketId, onClose }: TicketDetailDrawerProps) {
  const qc    = useQueryClient();
  const [comment, setComment]     = useState('');
  const [internal, setInternal]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => apiClient<{ data: TicketDetail }>(`/tickets/${ticketId}`),
    enabled: !!ticketId,
  });
  const ticket = res?.data;

  const commentMutation = useMutation({
    mutationFn: () => apiClient(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: comment.trim(), isInternal: internal }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      setComment('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: () => sileo.error({ title: 'Failed to add comment' }),
  });

  const meta = ticket ? [
    {
      label: 'Status',
      value: (
        <Badge variant={STATUS_VARIANT[ticket.status] ?? 'neutral'}>
          <HugeiconsIcon icon={STATUS_ICON[ticket.status] ?? Alert02Icon} size={11} />
          {STATUS_LABEL[ticket.status] ?? ticket.status}
        </Badge>
      ),
    },
    {
      label: 'Priority',
      value: <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? 'neutral'}>{ticket.priority}</Badge>,
    },
    { label: 'Category', value: ticket.category?.name ?? '—' },
    { label: 'Assigned', value: ticket.assignedTo?.name ?? 'Unassigned' },
    { label: 'Customer', value: ticket.customer ? `${ticket.customer.name} (${ticket.customer.email})` : '—' },
    { label: 'Created',  value: formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) },
  ] : [];

  return (
    <DrawerShell open={!!ticketId} onClose={onClose} title={ticket ? `#${ticket.id.slice(-6).toUpperCase()}` : 'Loading…'}>
      {isLoading && (
        <div className="flex flex-col gap-3 px-5 py-8">
          {[80, 55, 100, 70].map((w, i) => (
            <div key={i} className="h-4 rounded-md bg-surface-2" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {ticket && (
        <div className="flex flex-col">
          {/* Title + meta */}
          <div className="border-b border-border px-5 pb-3.5 pt-4">
            <h2 className="mb-3.5 text-ink">{ticket.title}</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {meta.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-mute">{label}</span>
                  <span className="text-[12.5px] text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="border-b border-border px-5 py-3.5">
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-mute">Description</div>
              <p className="m-0 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{ticket.description}</p>
            </div>
          )}

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
              {ticket.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="neutral">{tag.name}</Badge>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="px-5 py-3.5">
            <div className="mb-3 flex items-center gap-1.5">
              <HugeiconsIcon icon={BubbleChatIcon} size={13} className="text-mute" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-mute">
                Comments ({ticket.comments.length})
              </span>
            </div>

            {ticket.comments.length === 0 ? (
              <p className="mb-4 text-[13px] text-mute">No comments yet.</p>
            ) : (
              <div className="mb-4 flex flex-col gap-2.5">
                {ticket.comments.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'rounded-lg border border-border bg-surface p-3',
                      c.isInternal && 'border-l-2 border-l-warning bg-warning-tint',
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11.5px] font-semibold text-ink">{c.author.name}</span>
                      <div className="flex items-center gap-1.5">
                        {c.isInternal && <Badge variant="warning">Internal</Badge>}
                        <span className="text-[11px] text-mute">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <p className="m-0 text-[12.5px] leading-relaxed text-ink">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply box */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                className="resize-none rounded-none border-0 focus-visible:ring-0"
              />
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <Label className="flex cursor-pointer items-center gap-1.5 text-xs text-mute">
                  <Switch checked={internal} onCheckedChange={setInternal} />
                  Internal note
                </Label>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { if (comment.trim()) commentMutation.mutate(); }}
                  disabled={!comment.trim() || commentMutation.isPending}
                >
                  <HugeiconsIcon icon={MailSend01Icon} size={12} />
                  {commentMutation.isPending ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </div>
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
