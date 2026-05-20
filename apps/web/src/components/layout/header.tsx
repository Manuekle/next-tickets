'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification01Icon, Search01Icon, ArrowRight01Icon, Logout01Icon, Menu01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import GitHubStars from '@/components/github-stars';

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

const NOTIF_COLOR: Record<string, string> = {
  'ticket:created': 'oklch(0.60 0.18 220)',
  'ticket:updated': 'oklch(0.62 0.16 265)',
  'ticket:deleted': 'oklch(0.58 0.22 22)',
};

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname       = usePathname();
  const { user, logout } = useAuthStore();
  const router         = useRouter();
  const [userOpen,  setUserOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { items, markAllRead, clear } = useNotificationsStore();
  const unreadCount = items.filter((n) => !n.read).length;

  const routeLabel = (() => {
    for (const key of Object.keys(routeLabels).sort((a, b) => b.length - a.length)) {
      if (pathname.startsWith(key) && (pathname === key || pathname[key.length] === '/')) {
        return routeLabels[key];
      }
    }
    return routeLabels['/'];
  })();

  const initials = user?.name
    ? user.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleBellClick = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setUserOpen(false);
    if (opening) markAllRead();
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitHubStars compact />
        </div>
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
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={notifOpen}
            onClick={handleBellClick}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           '32px',
              height:          '32px',
              border:          0,
              borderRadius:    '9px',
              background:      notifOpen ? 'var(--surface-2)' : 'transparent',
              color:           notifOpen ? 'var(--ink)' : 'var(--mute)',
              cursor:          'pointer',
              transition:      'all 120ms',
              position:        'relative',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--surface-2)'; b.style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!notifOpen) { b.style.background = 'transparent'; b.style.color = 'var(--mute)'; } }}
          >
            <HugeiconsIcon icon={Notification01Icon} size={15} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position:     'absolute',
                  top:          '4px',
                  right:        '4px',
                  minWidth:     '14px',
                  height:       '14px',
                  borderRadius: '999px',
                  background:   'oklch(0.62 0.20 22)',
                  border:       '2px solid var(--surface)',
                  fontSize:     '8px',
                  fontWeight:   700,
                  color:        '#fff',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  padding:      '0 2px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                onClick={() => setNotifOpen(false)}
                aria-hidden="true"
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              />
              <div
                role="dialog"
                aria-label="Notifications"
                style={{
                  position:     'absolute',
                  top:          '40px',
                  right:        0,
                  zIndex:       51,
                  width:        '340px',
                  maxHeight:    '440px',
                  background:   'var(--surface)',
                  border:       '1px solid var(--border)',
                  borderRadius: '14px',
                  boxShadow:    'var(--shadow-pop)',
                  display:      'flex',
                  flexDirection:'column',
                  overflow:     'hidden',
                  animation:    'hx-pop 150ms cubic-bezier(0.2,0.8,0.2,1)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Notifications</span>
                  {items.length > 0 && (
                    <button
                      onClick={clear}
                      aria-label="Clear all notifications"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 7px', fontSize: '11px', color: 'var(--mute)', border: 0, borderRadius: '6px', background: 'var(--surface-2)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.50 0.20 22)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--mute)'; }}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={10} />
                      Clear
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {items.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: '8px' }}>
                      <HugeiconsIcon icon={Notification01Icon} size={22} color="var(--mute)" />
                      <span style={{ fontSize: '13px', color: 'var(--mute)' }}>No notifications</span>
                    </div>
                  ) : (
                    items.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          display:      'flex',
                          alignItems:   'flex-start',
                          gap:          '10px',
                          padding:      '10px 16px',
                          borderBottom: '1px solid var(--hairline)',
                          cursor:       n.ticketId ? 'pointer' : 'default',
                          transition:   'background 80ms',
                        }}
                        onClick={() => {
                          if (n.ticketId) { setNotifOpen(false); router.push(`/tickets/${n.ticketId}`); }
                        }}
                        onMouseEnter={(e) => { if (n.ticketId) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: NOTIF_COLOR[n.type] ?? 'var(--accent)', marginTop: '5px', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--mute)', flexShrink: 0, marginTop: '2px' }}>
                          {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
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
