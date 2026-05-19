'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Ticket, BookOpen, BarChart3, Settings,
  Workflow, Gauge, Shield, Search, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { href: '/',             label: 'Inbox',       icon: LayoutDashboard, count: 3  },
  { href: '/tickets',      label: 'Tickets',     icon: Ticket,          count: 24 },
  { href: '/analytics',    label: 'Analytics',   icon: BarChart3                  },
  { href: '/sla',          label: 'SLA',         icon: Gauge                      },
  { href: '/automations',  label: 'Automations', icon: Workflow                   },
  { href: '/knowledge',    label: 'Knowledge',   icon: BookOpen                   },
  { href: '/admin',        label: 'Admin',       icon: Shield                     },
];

const savedViews = [
  { label: 'My open tickets',    count: 7,  hue: 235 },
  { label: 'SLA at risk',        count: 3,  hue: 22  },
  { label: 'Unassigned billing', count: 5,  hue: 28  },
  { label: 'Enterprise tickets', count: 12, hue: 265 },
];

export function Sidebar() {
  const pathname  = usePathname();
  const user      = useAuthStore((s) => s.user);
  const [, setOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside
      style={{
        display:        'flex',
        flexDirection:  'column',
        background:     'var(--sb-bg)',
        color:          'var(--sb-ink)',
        borderRadius:   '18px',
        padding:        '14px 12px',
        gap:            '8px',
        position:       'sticky',
        top:            '12px',
        height:         'calc(100vh - 24px)',
        overflowY:      'auto',
        boxShadow:      'var(--shadow-lg)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '6px 8px 10px' }}>
        <div
          style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -6px 14px rgba(0,0,0,0.18), 0 4px 10px -4px var(--accent-glow)',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 4c4 3 10 3 14 0" />
            <path d="M5 12c4-3 10-3 14 0" />
            <path d="M5 20c4-3 10-3 14 0" />
          </svg>
        </div>
        <div style={{ fontSize: '14px', letterSpacing: '-0.01em', color: 'var(--sb-ink)', fontWeight: 500 }}>
          <span style={{ fontWeight: 600 }}>Helix</span>
          <span style={{ color: 'var(--sb-mute)', margin: '0 1px' }}>/</span>
          <span>support</span>
        </div>
      </div>

      {/* Search trigger */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          padding:        '8px 11px',
          border:         0,
          background:     'var(--sb-surface)',
          borderRadius:   '10px',
          color:          'var(--sb-mute)',
          fontSize:       '12px',
          cursor:         'pointer',
          textAlign:      'left',
          margin:         '0 2px 4px',
          transition:     'all 120ms',
          width:          'calc(100% - 4px)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sb-surface-2)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sb-surface)'; }}
      >
        <Search size={13} />
        <span style={{ flex: 1 }}>Search or jump to…</span>
        <Kbd>⌘K</Kbd>
      </button>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, overflowY: 'auto', minHeight: 0, width: '100%', padding: '0 2px' }}>
        <SectionLabel>Workspace</SectionLabel>

        {navItems.map((item) => {
          const Icon    = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <NavItem active={isActive}>
                <span style={{ display: 'flex', color: isActive ? '#fff' : 'var(--sb-mute)', flexShrink: 0 }}>
                  <Icon size={15} />
                </span>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                {item.count != null && (
                  <span style={{
                    fontSize:         '10.5px',
                    color:            isActive ? '#fff' : 'var(--sb-mute)',
                    background:       isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                    padding:          '1px 7px',
                    borderRadius:     '5px',
                    fontFeatureSettings: '"tnum"',
                    fontWeight:       600,
                  }}>
                    {item.count}
                  </span>
                )}
              </NavItem>
            </Link>
          );
        })}

        <SectionLabel style={{ marginTop: '18px' }}>Saved views</SectionLabel>
        {savedViews.map((v) => (
          <button
            key={v.label}
            style={{
              display:    'flex', alignItems: 'center', gap: '11px',
              padding:    '6px 10px', fontSize: '12.5px',
              border:     0, background: 'transparent',
              color:      'var(--sb-ink-soft)', cursor: 'pointer',
              borderRadius: '9px', textAlign: 'left', width: '100%',
              transition:  'all 100ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sb-surface)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span style={{
              width: '7px', height: '7px', borderRadius: '999px', flexShrink: 0,
              background: `oklch(0.62 0.16 ${v.hue})`,
              boxShadow:  '0 0 0 2px rgba(255,255,255,0.08)',
            }} />
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {v.label}
            </span>
            <span style={{
              fontSize: '10.5px', color: 'var(--sb-mute)',
              background: 'rgba(255,255,255,0.05)',
              padding: '1px 7px', borderRadius: '5px',
              fontFeatureSettings: '"tnum"', fontWeight: 600,
            }}>
              {v.count}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <NavItem active={pathname === '/settings'}>
            <span style={{ display: 'flex', color: pathname === '/settings' ? '#fff' : 'var(--sb-mute)', flexShrink: 0 }}>
              <Settings size={15} />
            </span>
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Settings
            </span>
          </NavItem>
        </Link>

        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            padding:      '8px',
            borderRadius: '10px',
            cursor:       'pointer',
            background:   'var(--sb-surface)',
            transition:   'background 120ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--sb-surface-2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--sb-surface)'; }}
        >
          <UserAvatar name={user?.name || 'User'} size={28} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'var(--sb-ink)', fontWeight: 500, fontSize: '12px', letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ color: 'var(--sb-mute)', fontSize: '11px' }}>
              {user?.role?.toLowerCase() || 'agent'} · Helix
            </div>
          </div>
          <ChevronRight size={12} color="var(--sb-mute)" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '11px',
        padding:      '8px 10px',
        borderRadius: '9px',
        color:        active ? '#fff' : 'var(--sb-ink-soft)',
        fontSize:     '13px',
        fontWeight:   500,
        letterSpacing: '-0.005em',
        position:     'relative',
        transition:   'all 100ms',
        background:   active
          ? 'linear-gradient(135deg, color-mix(in oklch, var(--accent) 28%, transparent), color-mix(in oklch, var(--accent-2) 22%, transparent))'
          : 'transparent',
        boxShadow:    active
          ? 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 12px -6px var(--accent-glow)'
          : 'none',
      }}
    >
      {active && (
        <span
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
      fontSize:       '10px',
      color:          'var(--sb-mute)',
      textTransform:  'uppercase',
      letterSpacing:  '0.10em',
      fontWeight:     600,
      padding:        '14px 10px 6px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      padding:        '1.5px 5px',
      fontSize:       '10.5px',
      background:     'rgba(255,255,255,0.06)',
      color:          'var(--sb-mute)',
      borderRadius:   '4px',
      fontFamily:     'var(--font-mono)',
      boxShadow:      'inset 0 0 0 1px rgba(255,255,255,0.06)',
      fontWeight:     500,
    }}>
      {children}
    </span>
  );
}

function UserAvatar({ name, size }: { name: string; size: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width:           `${size}px`,
      height:          `${size}px`,
      borderRadius:    '999px',
      background:      'linear-gradient(135deg, oklch(0.62 0.18 265), oklch(0.56 0.22 290))',
      color:           '#fff',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontSize:        `${Math.max(10, size * 0.38)}px`,
      fontWeight:      600,
      letterSpacing:   '-0.01em',
      flexShrink:      0,
    }}>
      {initials}
    </div>
  );
}
