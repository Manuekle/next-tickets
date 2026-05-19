'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Bell, Search, ChevronRight, LogOut } from 'lucide-react';
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

export function Header() {
  const pathname      = usePathname();
  const { user, logout } = useAuthStore();
  const router        = useRouter();
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
      display:       'flex',
      alignItems:    'center',
      gap:           '14px',
      height:        '64px',
      padding:       '0 28px',
      borderBottom:  '1px solid var(--hairline)',
      background:    'var(--surface)',
      position:      'sticky',
      top:           0,
      zIndex:        20,
      flexShrink:    0,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mute)' }}>
        <span>Support</span>
        <ChevronRight size={11} />
        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{routeLabel}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Search pill */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ot:open-palette'));
            }
          }}
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '8px',
            padding:       '7px 13px',
            border:        0,
            background:    'var(--surface-2)',
            borderRadius:  '10px',
            color:         'var(--mute)',
            fontSize:      '12.5px',
            cursor:        'pointer',
            minWidth:      '220px',
            transition:    'all 120ms',
            boxShadow:     'var(--shadow-inset)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
        >
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
          <kbd style={{
            display:       'inline-flex',
            alignItems:    'center',
            padding:       '1.5px 5px',
            fontSize:      '10.5px',
            background:    'var(--surface)',
            color:         'var(--mute)',
            borderRadius:  '4px',
            fontFamily:    'var(--font-mono)',
            boxShadow:     'var(--shadow-sm), inset 0 0 0 1px var(--hairline)',
            fontWeight:    500,
          }}>⌘K</kbd>
        </button>

        {/* Notification bell */}
        <button
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
          <Bell size={15} />
          <span style={{
            position:      'absolute',
            top:           '5px',
            right:         '5px',
            width:         '7px',
            height:        '7px',
            borderRadius:  '999px',
            background:    'oklch(0.62 0.20 22)',
            border:        '2px solid var(--surface)',
          }} />
        </button>

        {/* User avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            style={{
              width:           '28px',
              height:          '28px',
              borderRadius:    '999px',
              background:      'linear-gradient(135deg, oklch(0.92 0.08 265), oklch(0.86 0.10 265))',
              color:           'oklch(0.30 0.16 265)',
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
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              />
              <div style={{
                position:      'absolute',
                top:           '36px',
                right:         0,
                zIndex:        51,
                background:    'var(--surface)',
                border:        '1px solid var(--border)',
                borderRadius:  '12px',
                boxShadow:     'var(--shadow-pop)',
                minWidth:      '200px',
                padding:       '6px',
                animation:     'hx-pop 150ms cubic-bezier(0.2,0.8,0.2,1)',
              }}>
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--hairline)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{user?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '2px' }}>{user?.email}</div>
                </div>
                <button
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
                  <LogOut size={14} />
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
