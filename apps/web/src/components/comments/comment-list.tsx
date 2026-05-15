import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
      <p className="py-4 text-center text-sm text-muted-foreground">
        No comments yet
      </p>
    );
  }

  return (
    <div className="space-y-3" aria-live="polite" aria-label="Comments list">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg border p-3">
          <div className="mb-1 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {comment.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.createdAt), 'MMM d, HH:mm')}
            </span>
            {comment.isInternal && (
              <Badge
                variant="secondary"
                className="bg-purple-500/10 text-purple-500"
              >
                Internal
              </Badge>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
