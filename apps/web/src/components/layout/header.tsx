'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification01Icon, Search01Icon, ArrowRight01Icon, Logout01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

const routeLabels: Record<string, string> = {
  '/':             'Inbox',
  '/tickets':      'Tickets',
  '/analytics':    'Analytics',
  '/sla':          'SLA',
  '/automations':  'Automations',
  '/knowledge':    'Knowledge',
  '/admin':        'Admin',
  '/settings':     'Settings',
};

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname       = usePathname();
  const { user, logout } = useAuthStore();
  const router         = useRouter();
  const [userOpen, setUserOpen] = useState(false);

  const routeLabel = (() => {
    for (const key of Object.keys(routeLabels).sort((a, b) => b.length - a.length)) {
      if (pathname.startsWith(key) && (pathname === key || pathname[key.length] === '/')) {
        return routeLabels[key];
      }
    }
    return routeLabels['/'];
  })();

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      height:       '64px',
      padding:      '0 20px',
      borderBottom: '1px solid var(--hairline)',
      background:   'var(--surface)',
      position:     'sticky',
      top:          0,
      zIndex:       20,
      flexShrink:   0,
    }}>
      {/* Mobile hamburger */}
      <button
        type="button"
        className="hx-show-mobile"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
        style={{
          width: '34px', height: '34px', border: 0, borderRadius: '9px',
          background: 'transparent', color: 'var(--mute)', cursor: 'pointer',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          transition: 'background 100ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--mute)'; }}
      >
        <HugeiconsIcon icon={Menu01Icon} size={17} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)' }}>
        <span>Support</span>
        <HugeiconsIcon icon={ArrowRight01Icon} size={11} aria-hidden="true" />
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{routeLabel}</span>
      </nav>

      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Search pill */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ot:open-palette'));
            }
          }}
          aria-label="Search or run a command (⌘K)"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            padding:      '7px 13px',
            border:       0,
            background:   'var(--surface-2)',
            borderRadius: '10px',
            color:        'var(--mute)',
            fontSize:     '12.5px',
            cursor:       'pointer',
            transition:   'all 120ms',
            boxShadow:    'var(--shadow-inset)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        >
          <HugeiconsIcon icon={Search01Icon} size={13} aria-hidden="true" />
          <span className="hx-search-label" style={{ flex: 1, textAlign: 'left', minWidth: '140px' }}>Search…</span>
          <kbd className="hx-hide-mobile" aria-hidden="true" style={{
            display:      'inline-flex',
            alignItems:   'center',
            padding:      '1.5px 5px',
            fontSize:     '10.5px',
            background:   'var(--surface)',
            color:        'var(--mute)',
            borderRadius: '4px',
            fontFamily:   'var(--font-mono)',
            boxShadow:    'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
            fontWeight:   500,
          }}>⌘K</kbd>
        </button>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '32px',
            height:          '32px',
            border:          0,
            borderRadius:    '9px',
            background:      'transparent',
            color:           'var(--mute)',
            cursor:          'pointer',
            transition:      'all 120ms',
            position:        'relative',
          }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--surface-2)'; b.style.color = 'var(--ink)'; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--mute)'; }}
        >
          <HugeiconsIcon icon={Notification01Icon} size={15} aria-hidden="true" />
          <span
            aria-hidden="true"
            style={{
              position:     'absolute',
              top:          '5px',
              right:        '5px',
              width:        '7px',
              height:       '7px',
              borderRadius: '999px',
              background:   'oklch(0.62 0.20 22)',
              border:       '2px solid var(--surface)',
            }}
          />
        </button>

        {/* User avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            aria-label={`User menu for ${user?.name ?? 'user'}`}
            aria-expanded={userOpen}
            aria-haspopup="true"
            style={{
              width:           '28px',
              height:          '28px',
              borderRadius:    '999px',
              background:      'linear-gradient(135deg, oklch(0.90 0.02 260), oklch(0.84 0.03 255))',
              color:           'oklch(0.30 0.04 260)',
              border:          0,
              cursor:          'pointer',
              fontSize:        '11px',
              fontWeight:      600,
              letterSpacing:   '-0.01em',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              boxShadow:       '0 1px 2px rgba(34,26,17,0.08), inset 0 1px 0 rgba(255,255,255,0.40)',
            }}
          >
            {initials}
          </button>

          {userOpen && (
            <>
              <div
                onClick={() => setUserOpen(false)}
                aria-hidden="true"
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              />
              <div
                role="menu"
                style={{
                  position:     'absolute',
                  top:          '36px',
                  right:        0,
                  zIndex:       51,
                  background:   'var(--surface)',
                  border:       '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow:    'var(--shadow-pop)',
                  minWidth:     '200px',
                  padding:      '6px',
                  animation:    'hx-pop 150ms cubic-bezier(0.2,0.8,0.2,1)',
                }}
              >
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--hairline)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{user?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '2px' }}>{user?.email}</div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setUserOpen(false); logout(); router.push('/login'); }}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '8px',
                    width:        '100%',
                    padding:      '8px 12px',
                    border:       0,
                    background:   'transparent',
                    borderRadius: '8px',
                    cursor:       'pointer',
                    fontSize:     '13px',
                    color:        'oklch(0.50 0.20 22)',
                    textAlign:    'left',
                    transition:   'background 100ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.96 0.04 22)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={14} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
