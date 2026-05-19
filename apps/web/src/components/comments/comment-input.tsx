'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export function CommentInput({
  ticketId,
  showInternal = false,
}: {
  ticketId: string;
  showInternal?: boolean;
}) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

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
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
        placeholder="Write a comment… (use @ to mention someone)"
        aria-label="Write a comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        style={{
          width: '100%', padding: '9px 11px', fontSize: '13px', color: 'var(--ink)',
          border: 0, borderRadius: '9px', background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
          outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.55',
          boxSizing: 'border-box', transition: 'box-shadow 100ms',
        }}
        onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
        onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {showInternal && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            Internal comment (agents only)
          </label>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={!content.trim() || mutation.isPending}
          style={{
            marginLeft: 'auto', padding: '7px 16px', fontSize: '12px', fontWeight: 600, border: 0,
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
