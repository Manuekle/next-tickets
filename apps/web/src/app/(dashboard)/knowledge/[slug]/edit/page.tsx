'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { ArticleForm } from '@/components/knowledge/article-form';
import { Button, Skeleton } from '@/components/ui';
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
    queryFn: () => apiClient<{ data: any }>(`/knowledge/slug/${slug}`),
    enabled: !!slug,
  });

  useEffect(() => {
    if (user && !isAdminOrAgent) router.push('/knowledge');
  }, [user, isAdminOrAgent, router]);

  if (!user || !isAdminOrAgent) return null;

  if (isLoading) {
    return (
      <div className="flex max-w-[640px] flex-col gap-3.5">
        <Skeleton width={180} height={28} radius={7} />
        <Skeleton width="100%" height={320} radius={14} />
      </div>
    );
  }

  if (error || !res?.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm font-medium text-danger">Article not found</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/knowledge')}>
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  const article = res.data;

  return (
    <div className="flex max-w-[640px] flex-col gap-5">
      <div>
        <h1>Edit Article</h1>
        <p className="mt-1.5 text-[13px] text-mute">Update knowledge base article</p>
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
