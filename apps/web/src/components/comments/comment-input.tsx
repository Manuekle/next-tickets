'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { ZapIcon, PlusSignIcon, Delete02Icon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useSocket } from '@/components/providers/socket-provider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface QuickReply { id: string; label: string; content: string; }

const STORAGE_KEY = 'nt:quick-replies';

const DEFAULT_REPLIES: QuickReply[] = [
  { id: 'd1', label: 'Acknowledge',  content: "Thanks for reaching out — we've received your request and are looking into it now. We'll update you shortly." },
  { id: 'd2', label: 'Need info',    content: 'Could you share the steps to reproduce the issue and any error messages you see? A screenshot would also help.' },
  { id: 'd3', label: 'Resolved',     content: 'This should now be resolved on our side. Could you confirm it works for you? Closing the ticket if no reply in 48h.' },
];

function loadReplies(): QuickReply[] {
  if (typeof window === 'undefined') return DEFAULT_REPLIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REPLIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {}
  return DEFAULT_REPLIES;
}

function saveReplies(list: QuickReply[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export function CommentInput({
  ticketId,
  showInternal = false,
}: {
  ticketId: string;
  showInternal?: boolean;
}) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const queryClient = useQueryClient();
  const socket = useSocket();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const emitTyping = (typing: boolean) => {
    if (!socket || !ticketId) return;
    if (typing && !isTypingRef.current) {
      socket.emit('typing:start', { ticketId });
      isTypingRef.current = true;
    } else if (!typing && isTypingRef.current) {
      socket.emit('typing:stop', { ticketId });
      isTypingRef.current = false;
    }
  };

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current && socket && ticketId) {
      socket.emit('typing:stop', { ticketId });
    }
  }, [socket, ticketId]);

  useEffect(() => { setReplies(loadReplies()); }, []);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, isInternal }),
      }),
    onSuccess: () => {
      setContent('');
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      sileo.success({ title: 'Comment added' });
    },
    onError: () => sileo.error({ title: 'Failed to add comment' }),
  });

  const insertReply = (r: QuickReply) => {
    setContent((c) => (c.trim() ? `${c}\n\n${r.content}` : r.content));
    setOpen(false);
  };

  const saveCurrentAs = () => {
    if (!content.trim() || !newLabel.trim()) return;
    const next: QuickReply[] = [
      ...replies,
      { id: `u${Date.now()}`, label: newLabel.trim(), content: content.trim() },
    ];
    setReplies(next);
    saveReplies(next);
    setNewLabel('');
    sileo.success({ title: 'Quick reply saved' });
  };

  const removeReply = (id: string) => {
    const next = replies.filter((r) => r.id !== id);
    setReplies(next);
    saveReplies(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        placeholder="Write a comment… markdown supported (use @ to mention)"
        aria-label="Write a comment"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (e.target.value.trim()) {
            emitTyping(true);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => emitTyping(false), 2500);
          } else {
            emitTyping(false);
          }
        }}
        onBlur={() => emitTyping(false)}
        rows={3}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button variant="secondary" size="sm">
                  <HugeiconsIcon icon={ZapIcon} size={11} /> Quick replies
                </Button>
              }
            />
            <PopoverContent align="start" className="w-80 p-2">
              <div className="flex max-h-[220px] flex-col gap-0.5 overflow-y-auto">
                {replies.length === 0 && (
                  <div className="p-2 text-[11.5px] text-mute">No saved replies yet</div>
                )}
                {replies.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-1.5 rounded-md p-1.5 transition-colors hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      onClick={() => insertReply(r)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <div className="text-xs font-semibold text-ink">{r.label}</div>
                      <div className="truncate text-[11px] text-mute">{r.content}</div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeReply(r.id)}
                      title="Delete"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={11} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
                <Input
                  placeholder="Save current as…"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentAs(); }}
                  className="h-7 text-[11.5px]"
                />
                <Button
                  size="sm"
                  onClick={saveCurrentAs}
                  disabled={!content.trim() || !newLabel.trim()}
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={10} /> Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {showInternal && (
            <Label className="flex cursor-pointer items-center gap-2 text-xs text-mute">
              <Switch checked={isInternal} onCheckedChange={setIsInternal} />
              Internal
            </Label>
          )}
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => mutation.mutate()}
          disabled={!content.trim() || mutation.isPending}
        >
          {mutation.isPending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
