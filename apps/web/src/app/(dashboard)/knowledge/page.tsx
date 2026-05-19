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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize:      '36px',
            fontFamily:    'var(--font-display)',
            fontWeight:    400,
            color:         'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight:    1.05,
            margin:        0,
          }}>
            Knowledge Base
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>
            {data?.meta.total ?? 0} articles
          </p>
        </div>
        {isAdminOrAgent && (
          <Link href="/knowledge/new" style={{ textDecoration: 'none' }}>
            <button style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '6px',
              padding:      '8px 16px',
              fontSize:     '13px',
              fontWeight:   600,
              border:       0,
              borderRadius: '10px',
              background:   'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color:        '#fff',
              cursor:       'pointer',
              boxShadow:    '0 4px 12px -4px var(--accent-glow)',
              transition:   'all 120ms',
            }}>
              <HugeiconsIcon icon={Add01Icon} size={14} />
              New Article
            </button>
          </Link>
        )}
      </div>

      {/* Search + filters row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <HugeiconsIcon icon={Search01Icon} size={13} color="var(--mute)" style={{
            position:  'absolute',
            left:      '12px',
            top:       '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width:        '100%',
              paddingLeft:  '34px',
              paddingRight: '12px',
              paddingTop:   '9px',
              paddingBottom:'9px',
              fontSize:     '13px',
              border:       0,
              borderRadius: '10px',
              background:   'var(--surface)',
              color:        'var(--ink)',
              boxShadow:    'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
              outline:      'none',
              boxSizing:    'border-box',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1.5px var(--accent)'; }}
            onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.boxShadow = 'var(--shadow-sm), inset 0 0 0 1px var(--hairline)'; }}
          />
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                count={cat._count.articles}
                active={categoryId === cat.id}
                onClick={() => { setCategoryId(cat.id); setPage(1); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '60px 0' }}>
          <p style={{ fontSize: '14px', color: 'oklch(0.50 0.20 22)', fontWeight: 500 }}>Failed to load articles</p>
          <button
            onClick={() => refetch()}
            style={{
              padding:      '7px 14px',
              fontSize:     '13px',
              fontWeight:   500,
              border:       0,
              borderRadius: '9px',
              background:   'var(--surface-2)',
              color:        'var(--ink-soft)',
              cursor:       'pointer',
              boxShadow:    'var(--shadow-sm)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              background:   'var(--surface)',
              borderRadius: '14px',
              boxShadow:    'var(--shadow-sm)',
              padding:      '18px',
            }}>
              <div style={{ height: '18px', width: '75%', background: 'var(--surface-2)', borderRadius: '6px', marginBottom: '10px' }} />
              <div style={{ height: '14px', width: '100%', background: 'var(--surface-2)', borderRadius: '6px', marginBottom: '6px' }} />
              <div style={{ height: '14px', width: '55%', background: 'var(--surface-2)', borderRadius: '6px', marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ height: '12px', width: '70px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                <div style={{ height: '12px', width: '50px', background: 'var(--surface-2)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && data?.data.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '80px 0' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--mute)',
          }}>
            <HugeiconsIcon icon={Book01Icon} size={24} />
          </div>
          <p style={{ fontSize: '15px', color: 'var(--ink)', fontWeight: 500, margin: 0 }}>No articles found</p>
          <p style={{ fontSize: '13px', color: 'var(--mute)', margin: 0 }}>Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Articles grid */}
      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {data.data.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <PageBtn
                label="Previous"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              />
              <span style={{ fontSize: '12px', color: 'var(--mute)' }}>
                Page {page} of {data.meta.totalPages}
              </span>
              <PageBtn
                label="Next"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage(page + 1)}
              />
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
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '5px',
        padding:      '5px 10px',
        fontSize:     '12px',
        fontWeight:   active ? 600 : 500,
        border:       0,
        borderRadius: '8px',
        cursor:       'pointer',
        transition:   'all 100ms',
        background:   active ? 'var(--accent-tint)' : 'var(--surface-2)',
        color:        active ? 'var(--accent)' : 'var(--ink-soft)',
        boxShadow:    active ? 'inset 0 0 0 1px var(--accent-border)' : 'none',
      }}
    >
      {label}
      {count != null && (
        <span style={{
          fontSize:     '10.5px',
          fontFeatureSettings: '"tnum"',
          color:        active ? 'var(--accent)' : 'var(--mute)',
          fontWeight:   600,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:      '7px 14px',
        fontSize:     '13px',
        fontWeight:   500,
        border:       0,
        borderRadius: '9px',
        background:   'var(--surface-2)',
        color:        disabled ? 'var(--mute)' : 'var(--ink-soft)',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.5 : 1,
        boxShadow:    'var(--shadow-sm)',
        transition:   'all 100ms',
      }}
    >
      {label}
    </button>
  );
}
