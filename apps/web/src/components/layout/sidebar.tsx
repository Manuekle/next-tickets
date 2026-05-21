'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/logo';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon, Ticket01Icon, Book01Icon, BarChartIcon,
  WorkflowSquare01Icon, DashboardSpeed01Icon, SecurityLockIcon,
  Settings01Icon, SidebarLeft01Icon, Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { href: '/',          label: 'Inbox',     icon: DashboardSquare01Icon, statKey: 'open'  },
      { href: '/tickets',   label: 'Tickets',   icon: Ticket01Icon,          statKey: 'total' },
      { href: '/analytics', label: 'Analytics', icon: BarChartIcon },
      { href: '/sla',       label: 'SLA',       icon: DashboardSpeed01Icon },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/automations', label: 'Automations', icon: WorkflowSquare01Icon },
      { href: '/knowledge',   label: 'Knowledge',   icon: Book01Icon },
      { href: '/admin',       label: 'Admin',       icon: SecurityLockIcon },
    ],
  },
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

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));

  return (
    <aside
      aria-label="Main navigation"
      className="sticky top-2.5 flex h-[calc(100vh-20px)] flex-col gap-1 overflow-y-auto rounded-2xl border border-sb-border bg-sb-bg p-3"
    >
      {/* Brand + collapse */}
      <div className="flex items-center justify-between px-2 pb-3 pt-1">
        <Logo size={30} showText textSize="14px" />
        <button
          type="button"
          onClick={onClose}
          aria-label={onClose ? 'Close navigation' : 'Collapse sidebar'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sb-mute transition-colors hover:bg-sb-surface-2 hover:text-sb-ink"
        >
          <HugeiconsIcon icon={onClose ? Cancel01Icon : SidebarLeft01Icon} size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Sections */}
      <nav aria-label="Workspace navigation" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            <SectionLabel>{section.label}</SectionLabel>
            {section.items.map((item) => {
              const active = isActive(item.href);
              const count = 'statKey' in item ? navCounts[item.statKey as string] : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all',
                    active
                      ? 'bg-sb-active text-sb-ink shadow-sm'
                      : 'text-sb-ink-soft hover:bg-sb-surface-2 hover:text-sb-ink',
                  )}
                >
                  <span className={cn('flex shrink-0', active ? 'text-sb-ink' : 'text-sb-mute group-hover:text-sb-ink')} aria-hidden="true">
                    <HugeiconsIcon icon={item.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {count != null && count > 0 && (
                    <span
                      aria-label={`${count} items`}
                      className={cn(
                        'rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums',
                        active ? 'bg-accent text-accent-fg' : 'bg-sb-surface-2 text-sb-mute',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: settings + account */}
      <div className="mt-auto flex flex-col gap-1 pt-2">
        <Link
          href="/settings"
          onClick={onClose}
          aria-current={isActive('/settings') ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all',
            isActive('/settings')
              ? 'bg-sb-active text-sb-ink shadow-sm'
              : 'text-sb-ink-soft hover:bg-sb-surface-2 hover:text-sb-ink',
          )}
        >
          <span className={cn('flex shrink-0', isActive('/settings') ? 'text-sb-ink' : 'text-sb-mute')} aria-hidden="true">
            <HugeiconsIcon icon={Settings01Icon} size={16} />
          </span>
          <span className="flex-1 truncate">Settings</span>
        </Link>

        <div className="mt-1 px-1">
          <SectionLabel>Account</SectionLabel>
          <Link
            href="/settings"
            onClick={onClose}
            aria-label={`${user?.name || 'User'} profile`}
            className="mt-0.5 flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-sb-surface-2"
          >
            <Avatar name={user?.name || 'User'} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-sb-ink">{user?.name || 'User'}</div>
              <div className="truncate text-[11px] capitalize text-sb-mute">{user?.role?.toLowerCase() || 'agent'}</div>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sb-mute">
      {children}
    </div>
  );
}
