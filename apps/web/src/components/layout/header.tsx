'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification01Icon, Search01Icon, ArrowRight01Icon, Logout01Icon, Menu01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import GitHubStars from '@/components/github-stars';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
  'ticket:created': 'var(--info)',
  'ticket:updated': 'var(--accent)',
  'ticket:deleted': 'var(--danger)',
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

  const handleBellClick = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setUserOpen(false);
    if (opening) markAllRead();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2.5 border-b border-hairline bg-surface px-5">
      {/* Mobile hamburger */}
      <button
        type="button"
        className="hx-show-mobile h-[34px] w-[34px] items-center justify-center rounded-lg text-mute hover:bg-surface-2 hover:text-ink"
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
        style={{ display: 'none' }}
      >
        <HugeiconsIcon icon={Menu01Icon} size={17} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-mute">
        <span>Support</span>
        <HugeiconsIcon icon={ArrowRight01Icon} size={11} aria-hidden="true" />
        <span className="font-medium text-ink">{routeLabel}</span>
      </nav>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-2">
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
          className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-xs text-mute transition-colors hover:bg-surface-3"
        >
          <HugeiconsIcon icon={Search01Icon} size={13} aria-hidden="true" />
          <span className="hx-search-label min-w-[140px] flex-1 text-left">Search…</span>
          <kbd className="hx-hide-mobile inline-flex items-center rounded border border-border bg-surface px-1.5 py-px font-mono text-[10.5px] font-medium text-mute">
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={notifOpen}
            onClick={handleBellClick}
            className={cn(
              'relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              notifOpen ? 'bg-surface-2 text-ink' : 'text-mute hover:bg-surface-2 hover:text-ink',
            )}
          >
            <HugeiconsIcon icon={Notification01Icon} size={15} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border-2 border-surface bg-danger px-0.5 text-[8px] font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div onClick={() => setNotifOpen(false)} aria-hidden="true" className="fixed inset-0 z-50" />
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-10 z-[51] flex max-h-[440px] w-[340px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-3">
                  <span className="text-[13px] font-semibold text-ink">Notifications</span>
                  {items.length > 0 && (
                    <button
                      onClick={clear}
                      aria-label="Clear all notifications"
                      className="flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-1 text-[11px] text-mute hover:text-danger"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={10} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                      <HugeiconsIcon icon={Notification01Icon} size={22} className="text-mute" />
                      <span className="text-[13px] text-mute">No notifications</span>
                    </div>
                  ) : (
                    items.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-2.5 border-b border-hairline px-4 py-2.5 transition-colors',
                          n.ticketId ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default',
                        )}
                        onClick={() => {
                          if (n.ticketId) { setNotifOpen(false); router.push(`/tickets/${n.ticketId}`); }
                        }}
                      >
                        <span
                          className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full"
                          style={{ background: NOTIF_COLOR[n.type] ?? 'var(--accent)' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 text-[12.5px] font-semibold text-ink">{n.title}</div>
                          <div className="truncate text-xs text-mute">{n.message}</div>
                        </div>
                        <span className="mt-0.5 shrink-0 text-[10.5px] text-mute">
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
        <div className="relative">
          <button
            type="button"
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            aria-label={`User menu for ${user?.name ?? 'user'}`}
            aria-expanded={userOpen}
            aria-haspopup="true"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <Avatar name={user?.name || 'User'} size={28} />
          </button>

          {userOpen && (
            <>
              <div onClick={() => setUserOpen(false)} aria-hidden="true" className="fixed inset-0 z-50" />
              <div
                role="menu"
                className="absolute right-0 top-9 z-[51] min-w-[200px] rounded-xl border border-border bg-surface p-1.5 shadow-pop"
              >
                <div className="mb-1 border-b border-hairline px-3 pb-2 pt-2.5">
                  <div className="text-[13px] font-semibold text-ink">{user?.name}</div>
                  <div className="mt-0.5 text-[11px] text-mute">{user?.email}</div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setUserOpen(false); logout(); router.push('/login'); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger-tint"
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
