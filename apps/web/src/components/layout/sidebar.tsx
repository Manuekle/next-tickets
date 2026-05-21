'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/logo';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon, Ticket01Icon, Book01Icon, BarChartIcon,
  WorkflowSquare01Icon, DashboardSpeed01Icon, SecurityLockIcon, ArrowRight01Icon, Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const BASE_NAV = [
  { href: '/',             label: 'Inbox',       icon: DashboardSquare01Icon, statKey: 'open'    },
  { href: '/tickets',      label: 'Tickets',     icon: Ticket01Icon,          statKey: 'total'   },
  { href: '/analytics',    label: 'Analytics',   icon: BarChartIcon                              },
  { href: '/sla',          label: 'SLA',         icon: DashboardSpeed01Icon                      },
  { href: '/automations',  label: 'Automations', icon: WorkflowSquare01Icon                      },
  { href: '/knowledge',    label: 'Knowledge',   icon: Book01Icon                                },
  { href: '/admin',        label: 'Admin',       icon: SecurityLockIcon                          },
] as const;

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);

  const { data: statsRes } = useQuery({
    queryKey: ['sidebar-stats'],
    queryFn: () => apiClient<{ data: { openCount: number; pendingCount: number; closedCount: number } }>('/analytics/stats'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const stats = statsRes?.data;
  const navCounts: Record<string, number | undefined> = {
    open:  stats?.openCount,
    total: stats ? stats.openCount + stats.pendingCount : undefined,
  };

  return (
    <aside
      aria-label="Main navigation"
      className="sticky top-3 flex h-[calc(100vh-24px)] flex-col gap-2 overflow-y-auto rounded-xl border border-sb-border bg-sb-bg p-3 text-sb-ink"
    >
      {/* Logo + optional close */}
      <div className="flex items-center gap-2.5 px-2 pb-2.5 pt-1.5">
        <Logo size={30} showText textSize="13px" />
        <div className="flex-1" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sb-surface-2 text-sb-mute"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Workspace navigation" className="flex min-h-0 w-full flex-1 flex-col gap-px overflow-y-auto px-0.5">
        <SectionLabel>Workspace</SectionLabel>

        {BASE_NAV.map((item) => {
          const isActive = pathname === item.href;
          const count = 'statKey' in item ? navCounts[item.statKey] : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-sb-active text-sb-ink'
                  : 'text-sb-ink-soft hover:bg-sb-active/60 hover:text-sb-ink',
              )}
            >
              {isActive && (
                <span aria-hidden="true" className="absolute -left-2 top-2 bottom-2 w-0.5 rounded-full bg-accent" />
              )}
              <span className={cn('flex shrink-0', isActive ? 'text-sb-ink' : 'text-sb-mute')} aria-hidden="true">
                <HugeiconsIcon icon={item.icon} size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {count != null && count > 0 && (
                <span
                  aria-label={`${count} items`}
                  className="rounded px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-sb-mute"
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex w-full flex-col gap-1 pt-2.5">
        <Link
          href="/settings"
          onClick={onClose}
          aria-label={`${user?.name || 'User'} profile — go to settings`}
          className="flex items-center gap-2.5 rounded-lg bg-sb-surface p-2 transition-colors hover:bg-sb-surface-2"
        >
          <Avatar name={user?.name || 'User'} size={28} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-sb-ink">{user?.name || 'User'}</div>
            <div className="truncate text-[11px] text-sb-mute">{user?.role?.toLowerCase() || 'agent'}</div>
          </div>
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-sb-mute" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sb-mute">
      {children}
    </div>
  );
}
