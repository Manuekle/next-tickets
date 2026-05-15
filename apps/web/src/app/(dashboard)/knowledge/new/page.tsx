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
    if (user && !isAdminOrAgent) {
      router.push('/knowledge');
    }
  }, [user, isAdminOrAgent, router]);

  if (!user || !isAdminOrAgent) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Article</h1>
        <p className="text-sm text-muted-foreground">
          Create a new knowledge base article
        </p>
      </div>
      <ArticleForm />
    </div>
  );
}
