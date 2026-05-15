'use client';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function ArticleCard({
  slug,
  title,
  excerpt,
  category,
  author,
  createdAt,
  helpfulCount,
}: ArticleCardProps) {
  return (
    <Link href={`/knowledge/${slug}`}>
      <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
        <CardContent className="flex h-full flex-col gap-2 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-snug line-clamp-2">{title}</h3>
            {category && (
              <Badge variant="secondary" className="shrink-0">
                {category.name}
              </Badge>
            )}
          </div>
          {excerpt && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            {author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {author.name}
              </span>
            )}
            <span>{format(new Date(createdAt), 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-1 ml-auto">
              <ThumbsUp className="h-3 w-3" />
              {helpfulCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
