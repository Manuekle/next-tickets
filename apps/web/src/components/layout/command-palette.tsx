'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Ticket, BarChart3, BookOpen, Plus, X } from 'lucide-react';

const actions = [
  { label: 'Create new ticket',  href: '/tickets/new',  icon: Plus,           kbd: '⌘N'  },
  { label: 'Go to Inbox',        href: '/',             icon: LayoutDashboard              },
  { label: 'Go to Tickets',      href: '/tickets',      icon: Ticket                       },
  { label: 'Go to Analytics',    href: '/analytics',    icon: BarChart3                    },
  { label: 'Knowledge base',     href: '/knowledge',    icon: BookOpen                     },
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
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          100,
        background:      'rgba(15,18,30,0.32)',
        backdropFilter:  'blur(4px)',
        display:         'flex',
        alignItems:      'flex-start',
        justifyContent:  'center',
        paddingTop:      '12vh',
        animation:       'hx-fade 140ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:         'min(620px, 92vw)',
          background:    'var(--surface)',
          border:        '1px solid var(--border)',
          borderRadius:  '16px',
          boxShadow:     '0 24px 60px -20px rgba(15,18,30,0.30), 0 4px 12px rgba(15,18,30,0.08)',
          overflow:      'hidden',
          animation:     'hx-pop 200ms cubic-bezier(0.2,0.8,0.2,1)',
        }}
      >
        {/* Search bar */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
          padding:      '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={16} color="var(--mute)" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or run a command…"
            style={{
              flex:         1,
              border:       0,
              outline:      0,
              background:   'transparent',
              fontSize:     '15px',
              color:        'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          />
          <button
            onClick={close}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              justifyContent:  'center',
              width:           '22px',
              height:          '22px',
              border:          0,
              borderRadius:    '5px',
              background:      'var(--surface-2)',
              color:           'var(--mute)',
              cursor:          'pointer',
              transition:      'all 100ms',
            }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '6px 0' }}>
          <div style={{ padding: '8px 0' }}>
            <div style={{
              padding:        '4px 18px',
              fontSize:       '10px',
              color:          'var(--mute)',
              textTransform:  'uppercase',
              letterSpacing:  '0.08em',
              fontWeight:     600,
            }}>
              {query ? 'Results' : 'Quick actions'}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: '13px', color: 'var(--mute)' }}>
                No results for "{query}"
              </div>
            ) : (
              filtered.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.href}
                    onClick={() => { close(); router.push(a.href); }}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '10px',
                      width:        '100%',
                      padding:      '8px 18px',
                      background:   'transparent',
                      border:       0,
                      cursor:       'pointer',
                      textAlign:    'left',
                      color:        'var(--ink)',
                      transition:   'background 80ms',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--mute)', display: 'flex' }}><Icon size={15} /></span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, letterSpacing: '-0.005em' }}>{a.label}</span>
                    {a.kbd && (
                      <kbd style={{
                        display:       'inline-flex',
                        alignItems:    'center',
                        padding:       '1.5px 5px',
                        fontSize:      '10.5px',
                        background:    'var(--surface-2)',
                        color:         'var(--mute)',
                        borderRadius:  '4px',
                        fontFamily:    'var(--font-mono)',
                        boxShadow:     'var(--shadow-sm)',
                      }}>{a.kbd}</kbd>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer hint */}
        <div style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '10px 18px',
          borderTop:       '1px solid var(--border)',
          background:      'var(--surface-2)',
          fontSize:        '11px',
          color:           'var(--mute)',
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '0 4px', borderRadius: '3px', fontSize: '11px' }}>↵</kbd> open
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '0 4px', borderRadius: '3px', fontSize: '11px' }}>esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
