'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { ZapIcon, PlusSignIcon, Delete02Icon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';
import { sileo } from 'sileo';
import { useSocket } from '@/components/providers/socket-provider';

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
  const popRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
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
        rows={3}
        style={{
          width: '100%', padding: '9px 11px', fontSize: '13px', color: 'var(--ink)',
          border: 0, borderRadius: '9px', background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
          outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.55',
          boxSizing: 'border-box', transition: 'box-shadow 100ms',
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)';
          emitTyping(false);
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }} ref={popRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 9px', fontSize: '11.5px', fontWeight: 500, border: 0, borderRadius: '7px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer' }}
            >
              <HugeiconsIcon icon={ZapIcon} size={11} /> Quick replies
            </button>
            {open && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, width: '320px', zIndex: 50,
                background: 'var(--surface)', borderRadius: '10px', padding: '8px',
                boxShadow: 'var(--shadow-md), 0 0 0 1px var(--hairline)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '220px', overflowY: 'auto' }}>
                  {replies.length === 0 && (
                    <div style={{ padding: '8px', fontSize: '11.5px', color: 'var(--mute)' }}>No saved replies yet</div>
                  )}
                  {replies.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '7px', transition: 'background 100ms' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <button
                        onClick={() => insertReply(r)}
                        style={{ flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{r.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.content}</div>
                      </button>
                      <button
                        onClick={() => removeReply(r.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', border: 0, borderRadius: '5px', background: 'transparent', color: 'var(--mute)', cursor: 'pointer' }}
                        title="Delete"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: '6px' }}>
                  <input
                    placeholder="Save current as…"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentAs(); }}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '11.5px', border: 0, borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--ink)', outline: 'none' }}
                  />
                  <button
                    onClick={saveCurrentAs}
                    disabled={!content.trim() || !newLabel.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, border: 0, borderRadius: '6px', background: 'var(--accent)', color: '#fff', cursor: 'pointer', opacity: (!content.trim() || !newLabel.trim()) ? 0.45 : 1 }}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={10} /> Save
                  </button>
                </div>
              </div>
            )}
          </div>
          {showInternal && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Internal
            </label>
          )}
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!content.trim() || mutation.isPending}
          style={{
            padding: '7px 16px', fontSize: '12px', fontWeight: 600, border: 0,
            borderRadius: '9px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#fff', cursor: 'pointer', opacity: (!content.trim() || mutation.isPending) ? 0.55 : 1,
            boxShadow: '0 3px 10px -3px var(--accent-glow)', transition: 'opacity 100ms',
          }}
        >
          {mutation.isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
