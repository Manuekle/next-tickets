import { format } from 'date-fns';
import { renderMarkdown } from '@/lib/markdown';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  author: { name: string; email: string };
  createdAt: string;
}

export function CommentList({ comments }: { comments: Comment[] }) {
  if (!comments?.length) {
    return (
      <p className="py-4 text-center text-[13px] text-mute">No comments yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5" aria-live="polite" aria-label="Comments list">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={cn(
            'rounded-lg border border-border bg-surface p-3',
            comment.isInternal && 'border-l-2 border-l-warning bg-warning-tint',
          )}
        >
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Avatar name={comment.author.name} size={22} />
            <span className="text-xs font-semibold text-ink">{comment.author.name}</span>
            <span className="text-[11px] text-mute">{format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span>
            {comment.isInternal && <Badge variant="warning">Internal</Badge>}
          </div>
          <div
            className="markdown-body text-[13px] leading-relaxed text-ink"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
          />
        </div>
      ))}
    </div>
  );
}
