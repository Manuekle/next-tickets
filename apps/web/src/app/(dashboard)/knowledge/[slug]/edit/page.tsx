'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { ArticleForm } from '@/components/knowledge/article-form';
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
      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ height: '28px', width: '180px', borderRadius: '7px', background: 'var(--surface-2)' }} />
        <div style={{ height: '320px', borderRadius: '14px', background: 'var(--surface-2)' }} />
      </div>
    );
  }

  if (error || !res?.data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '80px 0' }}>
        <p style={{ fontSize: '14px', color: 'oklch(0.50 0.20 22)', fontWeight: 500 }}>Article not found</p>
        <button
          onClick={() => router.push('/knowledge')}
          style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: 0, borderRadius: '9px', background: 'var(--surface-2)', color: 'var(--ink-soft)', cursor: 'pointer' }}
        >
          Back to Knowledge Base
        </button>
      </div>
    );
  }

  const article = res.data;

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          Edit Article
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>Update knowledge base article</p>
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
