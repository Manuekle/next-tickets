'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { ArticleForm } from '@/components/knowledge/article-form';
import { useEffect } from 'react';

export default function NewArticlePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isAdminOrAgent =
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN ||
    user?.role === Role.AGENT;

  useEffect(() => {
    if (user && !isAdminOrAgent) router.push('/knowledge');
  }, [user, isAdminOrAgent, router]);

  if (!user || !isAdminOrAgent) return null;

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
          New Article
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>Create a new knowledge base article</p>
      </div>
      <ArticleForm />
    </div>
  );
}
