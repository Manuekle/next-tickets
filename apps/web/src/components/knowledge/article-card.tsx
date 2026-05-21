'use client';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';

import { ThumbsUpIcon, User02Icon } from '@hugeicons/core-free-icons';
import { format } from 'date-fns';
import { Card, Badge } from '@/components/ui';

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
    <Link href={`/knowledge/${slug}`} className="block h-full no-underline">
      <Card className="flex h-full flex-col gap-2 p-4 shadow-sm transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-md">
        {/* Header: title + category */}
        <div className="flex items-start justify-between gap-2.5">
          <h3 className="m-0 line-clamp-2 text-[13.5px] font-semibold leading-snug tracking-tight text-ink">
            {title}
          </h3>
          {category && (
            <Badge variant="neutral" className="shrink-0">
              {category.name}
            </Badge>
          )}
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p className="m-0 line-clamp-2 text-xs leading-relaxed text-mute">{excerpt}</p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2.5 pt-2.5 text-[11px] text-mute">
          {author && (
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={User02Icon} size={11} />
              {author.name}
            </span>
          )}
          <span>{format(new Date(createdAt), 'MMM d, yyyy')}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <HugeiconsIcon icon={ThumbsUpIcon} size={11} />
            {helpfulCount}
          </span>
        </div>
      </Card>
    </Link>
  );
}
