'use client';
import Link from 'next/link';
import { ThumbsUp, User } from 'lucide-react';
import { format } from 'date-fns';

interface ArticleCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: { id: string; name: string } | null;
  author: { name: string } | null;
  createdAt: string;
  helpfulCount: number;
}

export function ArticleCard({ slug, title, excerpt, category, author, createdAt, helpfulCount }: ArticleCardProps) {
  return (
    <Link href={`/knowledge/${slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background:    'var(--surface)',
          borderRadius:  '14px',
          boxShadow:     'var(--shadow-sm)',
          padding:       '18px',
          display:       'flex',
          flexDirection: 'column',
          gap:           '8px',
          height:        '100%',
          boxSizing:     'border-box',
          transition:    'box-shadow 140ms, transform 140ms',
          cursor:        'pointer',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = 'var(--shadow-md)';
          el.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = 'var(--shadow-sm)';
          el.style.transform = 'translateY(0)';
        }}
      >
        {/* Header: title + category */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
          <h3 style={{
            fontSize:      '13.5px',
            fontWeight:    600,
            color:         'var(--ink)',
            letterSpacing: '-0.005em',
            lineHeight:    1.35,
            margin:        0,
            display:       '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:      'hidden',
          }}>
            {title}
          </h3>
          {category && (
            <span style={{
              flexShrink:   0,
              padding:      '3px 8px',
              fontSize:     '11px',
              fontWeight:   500,
              borderRadius: '6px',
              background:   'var(--surface-2)',
              color:        'var(--ink-soft)',
              whiteSpace:   'nowrap',
            }}>
              {category.name}
            </span>
          )}
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p style={{
            fontSize:    '12.5px',
            color:       'var(--mute)',
            lineHeight:  1.55,
            margin:      0,
            display:     '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:    'hidden',
          }}>
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--mute)' }}>
          {author && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <User size={11} />
              {author.name}
            </span>
          )}
          <span>{format(new Date(createdAt), 'MMM d, yyyy')}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <ThumbsUp size={11} />
            {helpfulCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
