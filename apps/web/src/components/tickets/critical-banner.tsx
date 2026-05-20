'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, FireIcon, ArrowRight01Icon, TimeQuarter02Icon } from '@hugeicons/core-free-icons';
import { apiClient } from '@/lib/api';

interface CriticalTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  slaBreached?: boolean;
  customer?: { name: string };
  updatedAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function CriticalBanner() {
  const { data: critRes } = useQuery({
    queryKey: ['critical-tickets'],
    queryFn: () => apiClient<{ data: CriticalTicket[] }>('/tickets', { params: { priority: 'CRITICAL', limit: '10' } }),
    refetchInterval: 60_000,
  });

  const all = critRes?.data ?? [];
  const active = all.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').slice(0, 5);

  if (active.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, oklch(0.96 0.06 22 / 0.55), oklch(0.95 0.08 50 / 0.30))',
      borderRadius: '14px', padding: '14px 16px', overflow: 'hidden',
      boxShadow: 'var(--shadow-sm), inset 0 0 0 1px oklch(0.80 0.10 22 / 0.30)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'linear-gradient(135deg, oklch(0.60 0.22 22), oklch(0.65 0.20 40))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          boxShadow: '0 3px 10px -3px oklch(0.60 0.22 22 / 0.5)',
        }}>
          <HugeiconsIcon icon={FireIcon} size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'oklch(0.32 0.20 22)', letterSpacing: '-0.005em' }}>
            Needs attention
          </div>
          <div style={{ fontSize: '11.5px', color: 'oklch(0.42 0.16 22)' }}>
            {active.length} critical ticket{active.length > 1 ? 's' : ''} open
          </div>
        </div>
        <Link href="/tickets?priority=CRITICAL" style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px',
          fontWeight: 600, color: 'oklch(0.45 0.20 22)', textDecoration: 'none',
        }}>
          View all <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {active.map((t) => (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '7px 10px', borderRadius: '8px', textDecoration: 'none',
              background: 'oklch(1 0 0 / 0.50)', transition: 'background 120ms',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.85)'; }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = 'oklch(1 0 0 / 0.50)'; }}
          >
            <HugeiconsIcon icon={Alert02Icon} size={11} color="oklch(0.55 0.22 22)" />
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10.5px', color: 'oklch(0.45 0.10 22)', fontWeight: 600 }}>
              #{t.id.slice(-6).toUpperCase()}
            </span>
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.title}
            </span>
            {t.slaBreached && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px',
                fontSize: '10px', fontWeight: 700, borderRadius: '4px',
                background: 'oklch(0.55 0.22 22)', color: '#fff',
              }}>
                <HugeiconsIcon icon={TimeQuarter02Icon} size={9} /> SLA
              </span>
            )}
            <span style={{ fontSize: '10.5px', color: 'var(--mute)', fontFeatureSettings: '"tnum"' }}>{timeAgo(t.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
