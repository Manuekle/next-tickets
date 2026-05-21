'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { ArticleCard } from '@/components/knowledge/article-card';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Search01Icon, Book01Icon } from '@hugeicons/core-free-icons';
import { Button, Input, Card, Skeleton, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: { id: string; name: string } | null;
  author: { name: string } | null;
  createdAt: string;
  helpfulCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { articles: number };
}

export default function KnowledgePage() {
  const [search, setSearch]       = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage]           = useState(1);
  const user = useAuthStore((s) => s.user);

  const isAdminOrAgent =
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN ||
    user?.role === Role.AGENT;

  const params: Record<string, string> = {};
  if (search)     params.q          = search;
  if (categoryId) params.categoryId = categoryId;
  params.page  = String(page);
  params.limit = '12';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge-articles', params],
    queryFn:  () => apiClient<{ data: Article[]; meta: { total: number; totalPages: number } }>('/knowledge', { params }),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn:  () => apiClient<{ data: Category[] }>('/knowledge/categories'),
  });

  const categories = categoriesRes?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page head */}
      <div className="flex items-start justify-between">
        <div>
          <h1>Knowledge Base</h1>
          <p className="mt-1.5 text-[13px] text-mute">{data?.meta.total ?? 0} articles</p>
        </div>
        {isAdminOrAgent && (
          <Link href="/knowledge/new">
            <Button>
              <HugeiconsIcon icon={Add01Icon} size={14} />
              New Article
            </Button>
          </Link>
        )}
      </div>

      {/* Search + filters row */}
      <div className="flex flex-col gap-2.5">
        {/* Search */}
        <div className="relative max-w-[480px]">
          <HugeiconsIcon
            icon={Search01Icon}
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute"
          />
          <Input
            type="text"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <CategoryChip
              label="All"
              count={data?.meta.total}
              active={!categoryId}
              onClick={() => { setCategoryId(''); setPage(1); }}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.name}
                count={cat._count?.articles ?? 0}
                active={categoryId === cat.id}
                onClick={() => { setCategoryId(cat.id); setPage(1); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-3.5 py-16">
          <p className="text-sm font-medium text-danger">Failed to load articles</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton width="75%" height={18} className="mb-2.5" />
              <Skeleton width="100%" height={14} className="mb-1.5" />
              <Skeleton width="55%" height={14} className="mb-4" />
              <div className="flex gap-2">
                <Skeleton width={70} height={12} radius={4} />
                <Skeleton width={50} height={12} radius={4} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState
          icon={Book01Icon}
          title="No articles found"
          description="Try adjusting your search or filter criteria."
        />
      )}

      {/* Articles grid */}
      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3.5">
            {data.data.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-mute">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryChip({ label, count, active, onClick }: {
  label: string; count?: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
        active
          ? 'border-transparent bg-accent text-accent-fg shadow-sm'
          : 'border-border bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink',
      )}
    >
      {label}
      {count != null && (
        <span className={cn('font-mono text-[10.5px] font-semibold', active ? 'text-accent-fg' : 'text-mute')}>
          {count}
        </span>
      )}
    </button>
  );
}
