"use client";

import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';

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
    <a href="https://github.com/Manuekle/next-tickets" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? '6px' : '8px', padding: compact ? '6px 10px' : '8px 12px', background: 'var(--surface)', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', textDecoration: 'none', color: 'var(--ink)', fontWeight: 600 }}>
      <HugeiconsIcon icon={StarIcon} size={14} color="var(--accent)" />
      <span style={{ fontSize: compact ? '13px' : '14px' }}>{isLoading ? '…' : error ? 'GH' : count.toLocaleString()}</span>
    </a>
  );
}

export default GitHubStars;
