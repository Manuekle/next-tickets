import { format } from 'date-fns';
import { renderMarkdown } from '@/lib/markdown';

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
      <p style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', color: 'var(--mute)' }}>
        No comments yet
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-live="polite" aria-label="Comments list">
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            borderRadius: '10px', padding: '12px 14px',
            background: comment.isInternal ? 'oklch(0.97 0.04 60 / 0.40)' : 'var(--surface)',
            boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '999px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{comment.author.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--mute)' }}>{format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span>
            {comment.isInternal && (
              <span style={{ padding: '1px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, background: 'oklch(0.96 0.06 60)', color: 'oklch(0.50 0.18 60)' }}>
                Internal
              </span>
            )}
          </div>
          <div
            className="markdown-body"
            style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
          />
        </div>
      ))}
    </div>
  );
}
