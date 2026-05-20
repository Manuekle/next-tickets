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
      style={{
        display:       'flex',
        flexDirection: 'column',
        background:    'var(--sb-bg)',
        color:         'var(--sb-ink)',
        borderRadius:  '18px',
        padding:       '14px 12px',
        gap:           '8px',
        position:      'sticky',
        top:           '12px',
        height:        'calc(100vh - 24px)',
        overflowY:     'auto',
        boxShadow:     'var(--shadow-lg)',
      }}
    >
      {/* Logo + optional close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '6px 8px 10px' }}>
        <Logo size={32} showText textSize="13.5px" />
        <div style={{ flex: 1 }} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              width: '26px', height: '26px', border: 0, borderRadius: '7px',
              background: 'var(--sb-surface)', color: 'var(--sb-mute)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Workspace navigation" style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, overflowY: 'auto', minHeight: 0, width: '100%', padding: '0 2px' }}>
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
              style={{ textDecoration: 'none' }}
            >
              <NavItem active={isActive}>
                <span style={{ display: 'flex', color: isActive ? '#fff' : 'var(--sb-mute)', flexShrink: 0 }} aria-hidden="true">
                  <HugeiconsIcon icon={item.icon} size={15} />
                </span>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                {count != null && count > 0 && (
                  <span
                    aria-label={`${count} items`}
                    style={{
                      fontSize:            '10.5px',
                      color:               isActive ? '#fff' : 'var(--sb-mute)',
                      background:          isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                      padding:             '1px 7px',
                      borderRadius:        '5px',
                      fontFeatureSettings: '"tnum"',
                      fontWeight:          600,
                    }}
                  >
                    {count}
                  </span>
                )}
              </NavItem>
            </Link>
          );
        })}

      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        <Link
          href="/settings"
          onClick={onClose}
          aria-label={`${user?.name || 'User'} profile — go to settings`}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            padding:      '8px',
            borderRadius: '10px',
            textDecoration: 'none',
            background:   'var(--sb-surface)',
            transition:   'background 120ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sb-surface-2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sb-surface)'; }}
        >
          <UserAvatar name={user?.name || 'User'} size={28} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'var(--sb-ink)', fontWeight: 500, fontSize: '12px', letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ color: 'var(--sb-mute)', fontSize: '11px' }}>
              {user?.role?.toLowerCase() || 'agent'} · open-tickets
            </div>
          </div>
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="var(--sb-mute)" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}

function NavItem({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '11px',
        padding:       '8px 10px',
        borderRadius:  '9px',
        color:         active ? '#fff' : 'var(--sb-ink-soft)',
        fontSize:      '13px',
        fontWeight:    500,
        letterSpacing: '-0.005em',
        position:      'relative',
        transition:    'all 100ms',
        background:    active
          ? 'linear-gradient(135deg, color-mix(in oklch, var(--accent) 32%, transparent), color-mix(in oklch, var(--accent-2) 26%, transparent))'
          : 'transparent',
        boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
      }}
    >
      {active && (
        <span
          aria-hidden="true"
          style={{
            position:     'absolute',
            left:         '-8px',
            top:          '8px',
            bottom:       '8px',
            width:        '3px',
            borderRadius: '2px',
            background:   'linear-gradient(to bottom, var(--accent-2), var(--accent))',
          }}
        />
      )}
      {children}
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize:      '10px',
      color:         'var(--sb-mute)',
      textTransform: 'uppercase',
      letterSpacing: '0.10em',
      fontWeight:    600,
      padding:       '14px 10px 6px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function UserAvatar({ name, size }: { name: string; size: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width:          `${size}px`,
        height:         `${size}px`,
        borderRadius:   '999px',
        background:     'linear-gradient(135deg, oklch(0.52 0.04 258), oklch(0.42 0.04 262))',
        color:          '#fff',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       `${Math.max(10, size * 0.38)}px`,
        fontWeight:     600,
        letterSpacing:  '-0.01em',
        flexShrink:     0,
      }}
    >
      {initials}
    </div>
  );
}
