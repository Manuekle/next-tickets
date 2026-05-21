'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, DashboardSquare01Icon, Ticket01Icon, BarChartIcon, Book01Icon, Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

const actions = [
  { label: 'Create new ticket',  href: '/tickets/new',  icon: Add01Icon,           kbd: '⌘N'  },
  { label: 'Go to Inbox',        href: '/',             icon: DashboardSquare01Icon              },
  { label: 'Go to Tickets',      href: '/tickets',      icon: Ticket01Icon                       },
  { label: 'Go to Analytics',    href: '/analytics',    icon: BarChartIcon                       },
  { label: 'Knowledge base',     href: '/knowledge',    icon: Book01Icon                         },
];

export function CommandPalette() {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const router            = useRouter();

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );

  const close = useCallback(() => { setOpen(false); setQuery(''); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') close();
    };
    const onCustom = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('ot:open-palette', onCustom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ot:open-palette', onCustom);
    };
  }, [close]);

  if (!open) return null;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-[4px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(620px,92vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-pop"
      >
        {/* Search bar */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
          <HugeiconsIcon icon={Search01Icon} size={16} className="text-mute" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or run a command…"
            className="flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute-soft"
          />
          <button
            onClick={close}
            className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md bg-surface-2 text-mute hover:bg-surface-3"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-1.5">
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-mute">
              {query ? 'Results' : 'Quick actions'}
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-mute">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.href}
                  onClick={() => { close(); router.push(a.href); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-ink transition-colors hover:bg-surface-2"
                >
                  <span className="flex text-mute"><HugeiconsIcon icon={a.icon} size={15} /></span>
                  <span className="flex-1 text-[13px] font-medium">{a.label}</span>
                  {a.kbd && (
                    <kbd className="inline-flex items-center rounded bg-surface-2 px-1.5 py-px font-mono text-[10.5px] text-mute shadow-sm">
                      {a.kbd}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-border bg-surface-2 px-4 py-2.5 text-[11px] text-mute">
          <div className="flex gap-3.5">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-surface px-1 font-mono text-[11px]">↵</kbd> open
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded bg-surface px-1 font-mono text-[11px]">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
