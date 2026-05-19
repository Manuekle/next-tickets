'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ThumbsUpIcon, ThumbsDownIcon, User02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  category: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
  author: { name: string } | null;
  createdAt: string;
  updatedAt: string;
  helpfulCount: number;
  notHelpfulCount: number;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const slug = params.slug as string;

  const isAdminOrAgent =
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN ||
    user?.role === Role.AGENT;

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['knowledge-article', slug],
    queryFn: () => apiClient<{ data: ArticleDetail }>(`/knowledge/slug/${slug}`),
    enabled: !!slug,
  });

  const article = res?.data;

  const helpfulMutation = useMutation({
    mutationFn: () => apiClient(`/knowledge/${article!.id}/helpful`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', slug] });
      toast.success('Marked as helpful');
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  const notHelpfulMutation = useMutation({
    mutationFn: () => apiClient(`/knowledge/${article!.id}/not-helpful`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', slug] });
      toast.success('Feedback recorded');
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  const btnSecondary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '7px 13px', fontSize: '12px', fontWeight: 500, border: 0,
    borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--ink-soft)',
    cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'background 80ms',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
        {([100, 280, 80, 400] as number[]).map((w, i) => (
          <div key={i} style={{ height: i === 1 ? '32px' : '16px', width: `${w}px`, maxWidth: '100%', borderRadius: '6px', background: 'var(--surface-2)' }} />
        ))}
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '80px 0' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'oklch(0.50 0.20 22)' }}>Article not found</p>
        <p style={{ fontSize: '13px', color: 'var(--mute)' }}>The article may have been removed or does not exist.</p>
        <button style={btnSecondary} onClick={() => router.push('/knowledge')}>Back to Knowledge Base</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '780px' }}>
      <div>
        <button onClick={() => router.push('/knowledge')} style={{ ...btnSecondary, marginBottom: '12px', background: 'transparent', boxShadow: 'none', paddingLeft: 0, color: 'var(--mute)' }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> Back to Knowledge Base
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>{article.title}</h1>
          {isAdminOrAgent && (
            <button style={{ ...btnSecondary, flexShrink: 0 }} onClick={() => router.push(`/knowledge/${article.slug}/edit`)}>
              <HugeiconsIcon icon={PencilEdit01Icon} size={13} /> Edit
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
          {article.category && (
            <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--accent-tint)', color: 'var(--accent)' }}>
              {article.category.name}
            </span>
          )}
          {article.author && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--mute)' }}>
              <HugeiconsIcon icon={User02Icon} size={12} /> {article.author.name}
            </span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--mute)' }}>{format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
          {article.updatedAt !== article.createdAt && (
            <span style={{ fontSize: '12px', color: 'var(--mute)' }}>Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
          )}
        </div>
      </div>

      {article.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {article.tags.map((tag) => (
            <span key={tag.id} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: 'var(--surface-2)', color: 'var(--mute)' }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
        {article.content ? (
          <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: article.content }} />
        ) : (
          <p style={{ color: 'var(--mute)', fontStyle: 'italic', fontSize: '13px' }}>No content</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '13px', color: 'var(--mute)' }}>Was this helpful?</span>
        <button style={btnSecondary} onClick={() => helpfulMutation.mutate()} disabled={helpfulMutation.isPending}>
          <HugeiconsIcon icon={ThumbsUpIcon} size={13} /> Yes ({article.helpfulCount})
        </button>
        <button style={btnSecondary} onClick={() => notHelpfulMutation.mutate()} disabled={notHelpfulMutation.isPending}>
          <HugeiconsIcon icon={ThumbsDownIcon} size={13} /> No ({article.notHelpfulCount})
        </button>
      </div>
    </div>
  );
}
