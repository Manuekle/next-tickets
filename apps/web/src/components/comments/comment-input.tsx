'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button, TextArea } from '@heroui/react';
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
      queryClient.invalidateQueries({
        queryKey: ['ticket-comments', ticketId],
      });
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  return (
    <div className="space-y-2">
      <TextArea
        placeholder="Write a comment... (use @ to mention someone)"
        aria-label="Write a comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex items-center justify-between">
        {showInternal && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            Internal comment (agents only)
          </label>
        )}
        <Button
          size="sm"
         
          onClick={() => mutation.mutate()}
          isDisabled={!content.trim() || mutation.isPending}
        >
          {mutation.isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
