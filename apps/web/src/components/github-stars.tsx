"use client";

import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

async function fetchStars() {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const res = await fetch('https://api.github.com/repos/Manuekle/next-tickets', {
    headers: token ? { Authorization: `token ${token}` } : undefined,
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error('Failed to fetch GitHub stars');
  return res.json();
}

export function GitHubStars({ compact }: { compact?: boolean }) {
  const { data, isLoading, error } = useQuery({ queryKey: ['gh-stars'], queryFn: fetchStars, staleTime: 1000 * 60 * 10 });
  const count = data?.stargazers_count ?? 0;

  return (
    <a
      href="https://github.com/Manuekle/next-tickets"
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-surface font-semibold text-ink transition-colors hover:bg-surface-2',
        compact ? 'gap-1.5 px-2.5 py-1.5 text-[13px]' : 'gap-2 px-3 py-2 text-sm',
      )}
    >
      <HugeiconsIcon icon={StarIcon} size={14} className="text-mute" />
      <span>{isLoading ? '…' : error ? 'GH' : count.toLocaleString()}</span>
    </a>
  );
}

export default GitHubStars;
