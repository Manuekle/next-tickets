'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon, Add01Icon, BubbleChatIcon, MailSend01Icon,
  Alert02Icon, CheckmarkCircle01Icon, Clock01Icon, ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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
const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: 'oklch(0.58 0.22 22)',
  HIGH:     'oklch(0.70 0.18 50)',
  MEDIUM:   'oklch(0.70 0.14 90)',
  LOW:      'oklch(0.62 0.10 200)',
};
const STATUS_COLOR: Record<string, string> = {
  OPEN:                  'oklch(0.60 0.18 220)',
  IN_PROGRESS:           'oklch(0.62 0.16 265)',
  WAITING_ON_CUSTOMER:   'oklch(0.65 0.16 55)',
  RESOLVED:              'oklch(0.55 0.16 148)',
  CLOSED:                'oklch(0.55 0.04 270)',
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(2px)',
            }}
          />
          {/* Panel */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.8 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51,
              width: 'min(560px, 100vw)',
              background: 'var(--bg, #f4f0e6)',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.14)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--hairline)',
              background: 'var(--surface)', flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>
                {title}
              </span>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                style={{
                  width: '30px', height: '30px', border: 0, borderRadius: '8px',
                  background: 'var(--surface-2)', color: 'var(--mute)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3, var(--surface-2))'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
              </button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
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
      toast.success('Ticket created');
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setCategoryId('');
      onClose();
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <DrawerShell open={open} onClose={onClose} title="New ticket">
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
            Title <span style={{ color: 'oklch(0.58 0.22 22)' }}>*</span>
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short description of the issue"
            style={{
              width: '100%', padding: '9px 12px', fontSize: '13px', border: 0, borderRadius: '10px',
              background: 'var(--surface)', color: 'var(--ink)',
              boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
            onBlur={(e)  => { (e.target as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more context…"
            rows={4}
            style={{
              width: '100%', padding: '9px 12px', fontSize: '13px', border: 0, borderRadius: '10px',
              background: 'var(--surface)', color: 'var(--ink)',
              boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
              outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
            onBlur={(e)  => { (e.target as HTMLTextAreaElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
          />
        </div>

        {/* Priority */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
            Priority
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {priorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                style={{
                  flex: 1, padding: '7px 4px', fontSize: '11.5px', fontWeight: 600,
                  border: 0, borderRadius: '8px', cursor: 'pointer', transition: 'all 100ms',
                  background: priority === p ? PRIORITY_COLOR[p] : 'var(--surface)',
                  color: priority === p ? '#fff' : 'var(--ink-soft)',
                  boxShadow: priority === p ? `0 2px 8px -2px ${PRIORITY_COLOR[p]}66` : 'var(--shadow-sm)',
                }}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
              Category
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: '100%', padding: '9px 32px 9px 12px', fontSize: '13px', border: 0, borderRadius: '10px',
                  background: 'var(--surface)', color: 'var(--ink)',
                  boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
                  outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <HugeiconsIcon icon={ArrowDown01Icon} size={12} color="var(--mute)"
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
          style={{
            width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: 600, border: 0,
            borderRadius: '11px', cursor: title.trim() ? 'pointer' : 'not-allowed',
            background: title.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'var(--surface-2)',
            color: title.trim() ? '#fff' : 'var(--mute)',
            boxShadow: title.trim() ? '0 4px 14px -4px var(--accent-glow)' : 'none',
            transition: 'all 140ms', marginTop: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          {mutation.isPending ? 'Creating…' : 'Create ticket'}
        </button>
      </div>
    </DrawerShell>
  );
}

/* ─── TICKET DETAIL DRAWER ─── */
interface TicketDetailDrawerProps { ticketId: string | null; onClose: () => void }

export function TicketDetailDrawer({ ticketId, onClose }: TicketDetailDrawerProps) {
  const user  = useAuthStore((s) => s.user);
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
    onError: () => toast.error('Failed to add comment'),
  });

  const meta = ticket ? [
    { label: 'Status',   value: <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'6px', fontSize:'11.5px', fontWeight:600, background: `${STATUS_COLOR[ticket.status]}18`, color: STATUS_COLOR[ticket.status] }}><HugeiconsIcon icon={STATUS_ICON[ticket.status] ?? Alert02Icon} size={11}/>{STATUS_LABEL[ticket.status] ?? ticket.status}</span> },
    { label: 'Priority', value: <span style={{ padding:'2px 8px', borderRadius:'6px', fontSize:'11.5px', fontWeight:600, background:`${PRIORITY_COLOR[ticket.priority]}18`, color:PRIORITY_COLOR[ticket.priority] }}>{ticket.priority}</span> },
    { label: 'Category', value: ticket.category?.name ?? '—' },
    { label: 'Assigned', value: ticket.assignedTo?.name ?? 'Unassigned' },
    { label: 'Customer', value: ticket.customer ? `${ticket.customer.name} (${ticket.customer.email})` : '—' },
    { label: 'Created',  value: formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) },
  ] : [];

  return (
    <DrawerShell open={!!ticketId} onClose={onClose} title={ticket ? `#${ticket.id.slice(-6).toUpperCase()}` : 'Loading…'}>
      {isLoading && (
        <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[80, 55, 100, 70].map((w, i) => (
            <div key={i} style={{ height: '16px', width: `${w}%`, borderRadius: '6px', background: 'var(--surface-2)' }} />
          ))}
        </div>
      )}

      {ticket && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Title + meta */}
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--hairline)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em', margin: '0 0 14px' }}>
              {ticket.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
              {meta.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                  <span style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Description</div>
              <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
            </div>
          )}

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--hairline)', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {ticket.tags.map(({ tag }) => (
                <span key={tag.id} style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 500, background: 'var(--surface-2)', color: 'var(--ink-soft)' }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Comments */}
          <div style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <HugeiconsIcon icon={BubbleChatIcon} size={13} color="var(--mute)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Comments ({ticket.comments.length})
              </span>
            </div>

            {ticket.comments.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--mute)', margin: '0 0 16px' }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {ticket.comments.map((c) => (
                  <div key={c.id} style={{
                    padding: '10px 12px', borderRadius: '10px',
                    background: c.isInternal ? 'oklch(0.96 0.06 60 / 0.5)' : 'var(--surface)',
                    boxShadow: 'var(--shadow-sm)',
                    borderLeft: c.isInternal ? '3px solid oklch(0.70 0.18 60)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink)' }}>{c.author.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.isInternal && <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'oklch(0.96 0.06 60)', color: 'oklch(0.50 0.18 60)' }}>Internal</span>}
                        <span style={{ fontSize: '11px', color: 'var(--mute)' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply box */}
            <div style={{ background: 'var(--surface)', borderRadius: '12px', boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)', overflow: 'hidden' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px', border: 0,
                  background: 'transparent', color: 'var(--ink)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid var(--hairline)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} style={{ accentColor: 'oklch(0.70 0.18 60)' }} />
                  Internal note
                </label>
                <button
                  onClick={() => { if (comment.trim()) commentMutation.mutate(); }}
                  disabled={!comment.trim() || commentMutation.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', fontSize: '12px', fontWeight: 600, border: 0, borderRadius: '8px',
                    background: comment.trim() ? 'var(--accent)' : 'var(--surface-2)',
                    color: comment.trim() ? '#fff' : 'var(--mute)', cursor: comment.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 100ms',
                  }}
                >
                  <HugeiconsIcon icon={MailSend01Icon} size={12} />
                  {commentMutation.isPending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </DrawerShell>
  );
}
