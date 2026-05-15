'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { format } from 'date-fns';
import { ArrowLeft, ThumbsUp, ThumbsDown, User, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

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
    queryFn: () =>
      apiClient<{ data: ArticleDetail }>(`/knowledge/slug/${slug}`),
    enabled: !!slug,
  });

  const article = res?.data;

  const helpfulMutation = useMutation({
    mutationFn: () =>
      apiClient(`/knowledge/${article!.id}/helpful`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', slug] });
      toast.success('Marked as helpful');
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  const notHelpfulMutation = useMutation({
    mutationFn: () =>
      apiClient(`/knowledge/${article!.id}/not-helpful`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', slug] });
      toast.success('Feedback recorded');
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-destructive">Article not found</p>
        <p className="text-sm text-muted-foreground">
          The article may have been removed or does not exist.
        </p>
        <Button variant="outline" onClick={() => router.push('/knowledge')}>
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => router.push('/knowledge')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Knowledge Base
        </Button>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
          {isAdminOrAgent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/knowledge/${article.slug}/edit`)}
            >
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {article.category && (
            <Badge variant="secondary">{article.category.name}</Badge>
          )}
          {article.author && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {article.author.name}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {format(new Date(article.createdAt), 'MMM d, yyyy')}
          </span>
          {article.updatedAt !== article.createdAt && (
            <span className="text-sm text-muted-foreground">
              Updated {format(new Date(article.updatedAt), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="max-w-none">
        {article.content ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <p className="text-muted-foreground italic">No content</p>
        )}
      </div>

      <div className="flex items-center gap-4 border-t pt-6">
        <span className="text-sm text-muted-foreground">Was this article helpful?</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => helpfulMutation.mutate()}
          loading={helpfulMutation.isPending}
        >
          <ThumbsUp className="mr-1 h-4 w-4" />
          Yes ({article.helpfulCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => notHelpfulMutation.mutate()}
          loading={notHelpfulMutation.isPending}
        >
          <ThumbsDown className="mr-1 h-4 w-4" />
          No ({article.notHelpfulCount})
        </Button>
      </div>
    </div>
  );
}
