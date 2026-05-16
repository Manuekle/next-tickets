'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button, Input, Chip, Skeleton } from '@heroui/react';
import { ArticleCard } from '@/components/knowledge/article-card';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@next-tickets/shared';
import { Plus, Search, BookOpen } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);

  const isAdminOrAgent =
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN ||
    user?.role === Role.AGENT;

  const params: Record<string, string> = {};
  if (search) params.q = search;
  if (categoryId) params.categoryId = categoryId;
  params.page = String(page);
  params.limit = '12';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge-articles', params],
    queryFn: () =>
      apiClient<{ data: Article[]; meta: { total: number; totalPages: number } }>(
        '/knowledge',
        { params },
      ),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: () =>
      apiClient<{ data: Category[] }>('/knowledge/categories'),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            {data?.meta.total || 0} total articles
          </p>
        </div>
        {isAdminOrAgent && (
          <Link href="/knowledge/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Article
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
        <Input
          placeholder="Search articles..."
          className="pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {categoriesRes?.data && categoriesRes.data.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip
            color={!categoryId ? 'accent' : 'default'}
            variant={!categoryId ? 'primary' : 'soft'}
            className="cursor-pointer"
            onClick={() => {
              setCategoryId('');
              setPage(1);
            }}
          >
            All
          </Chip>
          {categoriesRes.data.map((cat) => (
            <Chip
              key={cat.id}
              color={categoryId === cat.id ? 'accent' : 'default'}
              variant={categoryId === cat.id ? 'primary' : 'soft'}
              className="cursor-pointer"
              onClick={() => {
                setCategoryId(cat.id);
                setPage(1);
              }}
            >
              {cat.name} ({cat._count.articles})
            </Chip>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-lg text-destructive">Failed to load articles</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4">
              <Skeleton className="mb-2 h-5 w-3/4 rounded-lg" />
              <Skeleton className="mb-1 h-4 w-full rounded-lg" />
              <Skeleton className="mb-4 h-4 w-1/2 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && data?.data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">No articles found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                isDisabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={page >= data.meta.totalPages}
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
