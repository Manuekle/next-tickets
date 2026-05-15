'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { ArticleForm } from '@/components/knowledge/article-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const slug = params.slug as string;

  const isAdminOrAgent =
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN ||
    user?.role === Role.AGENT;

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['knowledge-article', slug],
    queryFn: () =>
      apiClient<{ data: any }>(`/knowledge/slug/${slug}`),
    enabled: !!slug,
  });

  useEffect(() => {
    if (user && !isAdminOrAgent) {
      router.push('/knowledge');
    }
  }, [user, isAdminOrAgent, router]);

  if (!user || !isAdminOrAgent) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !res?.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-destructive">Article not found</p>
        <Button variant="outline" onClick={() => router.push('/knowledge')}>
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  const article = res.data;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Article</h1>
        <p className="text-sm text-muted-foreground">
          Update knowledge base article
        </p>
      </div>
      <ArticleForm
        initialData={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          categoryId: article.category?.id ?? null,
          tags: article.tags ?? [],
          published: article.published ?? false,
        }}
      />
    </div>
  );
}
