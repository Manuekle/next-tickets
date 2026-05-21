'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ThumbsUpIcon, ThumbsDownIcon, User02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { sileo } from 'sileo';
import { Button, Badge, Card, CardContent, Skeleton } from '@/components/ui';

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
      sileo.success({ title: 'Marked as helpful' });
    },
    onError: () => sileo.error({ title: 'Failed to submit feedback' }),
  });

  const notHelpfulMutation = useMutation({
    mutationFn: () => apiClient(`/knowledge/${article!.id}/not-helpful`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', slug] });
      sileo.success({ title: 'Feedback recorded' });
    },
    onError: () => sileo.error({ title: 'Failed to submit feedback' }),
  });

  if (isLoading) {
    return (
      <div className="flex max-w-[780px] flex-col gap-3.5">
        <Skeleton width={100} height={16} />
        <Skeleton width={280} height={32} />
        <Skeleton width={80} height={16} />
        <Skeleton width={400} height={16} className="max-w-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm font-medium text-danger">Article not found</p>
        <p className="text-[13px] text-mute">The article may have been removed or does not exist.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/knowledge')}>Back to Knowledge Base</Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-[780px] flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/knowledge')}
          className="mb-3 px-0 text-mute hover:bg-transparent"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> Back to Knowledge Base
        </Button>
        <div className="flex items-start justify-between gap-4">
          <h1>{article.title}</h1>
          {isAdminOrAgent && (
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => router.push(`/knowledge/${article.slug}/edit`)}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={13} /> Edit
            </Button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {article.category && (
            <Badge variant="solid">{article.category.name}</Badge>
          )}
          {article.author && (
            <span className="flex items-center gap-1 text-xs text-mute">
              <HugeiconsIcon icon={User02Icon} size={12} /> {article.author.name}
            </span>
          )}
          <span className="text-xs text-mute">{format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
          {article.updatedAt !== article.createdAt && (
            <span className="text-xs text-mute">Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}</span>
          )}
        </div>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">{tag.name}</Badge>
          ))}
        </div>
      )}

      <Card className="shadow-md">
        <CardContent className="p-6">
          {article.content ? (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <p className="text-[13px] italic text-mute">No content</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <span className="text-[13px] text-mute">Was this helpful?</span>
        <Button variant="secondary" size="sm" onClick={() => helpfulMutation.mutate()} disabled={helpfulMutation.isPending}>
          <HugeiconsIcon icon={ThumbsUpIcon} size={13} /> Yes ({article.helpfulCount})
        </Button>
        <Button variant="secondary" size="sm" onClick={() => notHelpfulMutation.mutate()} disabled={notHelpfulMutation.isPending}>
          <HugeiconsIcon icon={ThumbsDownIcon} size={13} /> No ({article.notHelpfulCount})
        </Button>
      </div>
    </div>
  );
}
