'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon, Add01Icon, FilterIcon, ArrowUpDownIcon, ListViewIcon, GridViewIcon, CheckmarkSquareIcon, Cancel01Icon,
} from '@hugeicons/core-free-icons';

const STATUS_META: Record<string, { label: string; hue: number; dotChroma: number }> = {
  OPEN:                { label: 'Open',        hue: 235, dotChroma: 0.18 },
  IN_PROGRESS:         { label: 'In progress', hue: 65,  dotChroma: 0.18 },
  WAITING_ON_CUSTOMER: { label: 'Waiting',     hue: 305, dotChroma: 0.16 },
  RESOLVED:            { label: 'Resolved',    hue: 155, dotChroma: 0.16 },
  CLOSED:              { label: 'Closed',      hue: 260, dotChroma: 0.015 },
};

const PRIORITY_META: Record<string, { label: string; hue: number }> = {
  LOW:      { label: 'Low',      hue: 155 },
  MEDIUM:   { label: 'Medium',   hue: 70  },
  HIGH:     { label: 'High',     hue: 40  },
  CRITICAL: { label: 'Critical', hue: 22  },
};

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  customer:   { name: string; email: string };
  assignedTo: { name: string } | null;
  createdAt:  string;
  updatedAt:  string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.round(ms / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      '3px 9px 3px 7px',
      fontSize:     '11px',
      fontWeight:   600,
      borderRadius: '999px',
      background:   `oklch(0.93 ${m.dotChroma * 0.32} ${m.hue})`,
      color:        `oklch(0.32 ${m.dotChroma} ${m.hue})`,
      whiteSpace:   'nowrap',
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '999px',
        background: `oklch(0.54 ${m.dotChroma * 1.1} ${m.hue})`,
      }} />
      {m.label}
    </span>
  );
}

function PriorityBar({ priority }: { priority: string }) {
  const m     = PRIORITY_META[priority];
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const lvl   = order.indexOf(priority) + 1;
  if (!m) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--ink-soft)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} style={{
            width:   '3px',
            height:  `${3 + i * 2}px`,
            borderRadius: '1.5px',
            background: i <= lvl ? `oklch(0.60 0.20 ${m.hue})` : 'var(--surface-3)',
          }} />
        ))}
      </span>
      {m.label}
    </span>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '16px',
        height:          '16px',
        borderRadius:    '4px',
        cursor:          'pointer',
        border:          `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        background:      checked ? 'var(--accent)' : 'var(--surface)',
        color:           'var(--accent-fg)',
        transition:      'all 120ms',
        flexShrink:      0,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </label>
  );
}

const STATUS_TABS = [
  { value: '',                    label: 'All'          },
  { value: 'OPEN',                label: 'Open'         },
  { value: 'IN_PROGRESS',         label: 'In progress'  },
  { value: 'WAITING_ON_CUSTOMER', label: 'Waiting'      },
  { value: 'RESOLVED',            label: 'Resolved'     },
];

const BOARD_COLS = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED'] as const;

export default function TicketsPage() {
  const router = useRouter();
  const [view,        setView]        = useState<'table' | 'board'>('table');
  const [search,      setSearch]      = useState('');
  const [statusTab,   setStatusTab]   = useState('');
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [page,        setPage]        = useState(1);

  const params: Record<string, string> = {};
  if (search)    params.q      = search;
  if (statusTab) params.status = statusTab;
  params.page  = String(page);
  params.limit = '25';

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      apiClient<{ data: Ticket[]; meta: { total: number; totalPages: number } }>('/tickets', { params }),
  });

  const tickets = data?.data ?? [];
  const total   = data?.meta?.total ?? 0;

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (selected.size === tickets.length) setSelected(new Set());
    else setSelected(new Set(tickets.map((t) => t.id)));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <div style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '8px',
            fontSize:        '11px',
            color:           'var(--mute)',
            textTransform:   'uppercase',
            letterSpacing:   '0.12em',
            fontWeight:      600,
            marginBottom:    '12px',
            padding:         '4px 10px 4px 8px',
            background:      'var(--surface-2)',
            borderRadius:    '6px',
            boxShadow:       'var(--shadow-inset)',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '2px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              boxShadow: '0 0 6px var(--accent-glow)',
            }} />
            Workspace
          </div>
          <h1 style={{
            fontSize:      '36px',
            fontWeight:    400,
            color:         'var(--ink)',
            letterSpacing: '-0.025em',
            lineHeight:    1.0,
            margin:        0,
            fontFamily:    'var(--font-display)',
          }}>Tickets</h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '8px', lineHeight: 1.5 }}>
            {total} tickets
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
          <button
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '6px',
              padding:       '8px 14px',
              border:        0,
              background:    'var(--surface-2)',
              color:         'var(--ink)',
              fontSize:      '13px',
              fontWeight:    500,
              borderRadius:  '10px',
              cursor:        'pointer',
              boxShadow:     'var(--shadow-sm), var(--shadow-inset)',
            }}
          >
            <HugeiconsIcon icon={CheckmarkSquareIcon} size={14} />
            Saved views
          </button>
          <button
            onClick={() => router.push('/tickets/new')}
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '6px',
              padding:       '8px 14px',
              border:        0,
              background:    'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color:         'var(--accent-fg)',
              fontSize:      '13px',
              fontWeight:    500,
              borderRadius:  '10px',
              cursor:        'pointer',
              boxShadow:     'inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 14px -4px var(--accent-glow)',
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            New ticket
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Status tabs */}
        <div style={{
          display:    'inline-flex',
          gap:        '2px',
          padding:    '3px',
          background: 'var(--surface-2)',
          borderRadius: '11px',
          boxShadow:  'var(--shadow-inset), inset 0 0 0 1px var(--hairline)',
        }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusTab(tab.value); setPage(1); }}
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '5px',
                padding:      '5px 10px',
                border:       0,
                background:   statusTab === tab.value ? 'var(--surface)' : 'transparent',
                color:        statusTab === tab.value ? 'var(--ink)' : 'var(--mute)',
                fontSize:     '12px',
                fontWeight:   500,
                letterSpacing: '-0.005em',
                cursor:       'pointer',
                borderRadius: '8px',
                boxShadow:    statusTab === tab.value ? 'var(--shadow-sm)' : 'none',
                transition:   'all 130ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <label style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '7px 11px',
          background:   'var(--surface-2)',
          borderRadius: '10px',
          border:       0,
          boxShadow:    'var(--shadow-inset), inset 0 0 0 1px var(--hairline)',
          transition:   'box-shadow 120ms',
        }}>
          <HugeiconsIcon icon={Search01Icon} size={13} color="var(--mute)" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tickets…"
            style={{
              background:   'transparent',
              border:       0,
              outline:      0,
              fontSize:     '12.5px',
              color:        'var(--ink)',
              width:        '180px',
            }}
          />
        </label>

        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 11px', border: 0, background: 'var(--surface-2)',
          color: 'var(--ink)', fontSize: '12px', fontWeight: 500, borderRadius: '10px',
          cursor: 'pointer', boxShadow: 'var(--shadow-sm), var(--shadow-inset)',
        }}>
          <HugeiconsIcon icon={FilterIcon} size={13} /> Filter
        </button>

        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 11px', border: 0, background: 'var(--surface-2)',
          color: 'var(--ink)', fontSize: '12px', fontWeight: 500, borderRadius: '10px',
          cursor: 'pointer', boxShadow: 'var(--shadow-sm), var(--shadow-inset)',
        }}>
          <HugeiconsIcon icon={ArrowUpDownIcon} size={13} /> Sort
        </button>

        <div style={{ width: '1px', height: '22px', background: 'var(--hairline)' }} />

        {/* View toggle */}
        <div style={{
          display: 'inline-flex', gap: '2px', padding: '3px',
          background: 'var(--surface-2)', borderRadius: '11px',
          boxShadow: 'var(--shadow-inset), inset 0 0 0 1px var(--hairline)',
        }}>
          {(['table', 'board'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '5px',
                padding:      '5px 10px',
                border:       0,
                background:   view === v ? 'var(--surface)' : 'transparent',
                color:        view === v ? 'var(--ink)' : 'var(--mute)',
                fontSize:     '12px',
                fontWeight:   500,
                cursor:       'pointer',
                borderRadius: '8px',
                boxShadow:    view === v ? 'var(--shadow-sm)' : 'none',
                transition:   'all 130ms',
              }}
            >
              {v === 'table' ? <HugeiconsIcon icon={ListViewIcon} size={12} /> : <HugeiconsIcon icon={GridViewIcon} size={12} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
          padding:      '10px 18px',
          background:   'var(--accent-tint)',
          borderRadius: '12px',
          border:       '1px solid var(--accent-border)',
          animation:    'hx-rise 150ms ease-out',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--accent-fg-on-tint)', fontWeight: 500 }}>
            {selected.size} selected
          </span>
          <div style={{ flex: 1 }} />
          {['Assign', 'Add tag', 'Change status', 'Resolve'].map((action) => (
            <button key={action} style={{
              padding: '5px 10px', border: 0, background: 'transparent',
              color: 'var(--accent-fg-on-tint)', fontSize: '12px', fontWeight: 500,
              borderRadius: '7px', cursor: 'pointer', transition: 'background 100ms',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in oklch, var(--accent) 14%, transparent)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >{action}</button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '22px', height: '22px', border: 0, borderRadius: '5px',
              background: 'transparent', color: 'var(--accent-fg-on-tint)', cursor: 'pointer',
            }}
          ><HugeiconsIcon icon={Cancel01Icon} size={13} /></button>
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div style={{
          background:   'var(--surface)',
          borderRadius: '16px',
          boxShadow:    'var(--shadow-md)',
          overflow:     'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: '32px 90px 1fr 120px 120px 120px 70px',
            padding:             '10px 18px',
            borderBottom:        '1px solid var(--hairline)',
            fontSize:            '11px',
            color:               'var(--mute)',
            fontWeight:          600,
            textTransform:       'uppercase',
            letterSpacing:       '0.06em',
            background:          'var(--surface-2)',
            columnGap:           '12px',
          }}>
            <span><Checkbox checked={selected.size === tickets.length && tickets.length > 0} onChange={toggleAll} /></span>
            <span>ID</span>
            <span>Ticket</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Assignee</span>
            <span style={{ textAlign: 'right' }}>Updated</span>
          </div>

          {/* Rows */}
          <div>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{
                    display:             'grid',
                    gridTemplateColumns: '32px 90px 1fr 120px 120px 120px 70px',
                    padding:             '13px 18px',
                    borderBottom:        i < 7 ? '1px solid var(--hairline)' : 'none',
                    columnGap:           '12px',
                    alignItems:          'center',
                  }}>
                    <div style={{ width: '16px', height: '16px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ height: '11px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ height: '13px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ height: '22px', width: '80px', background: 'var(--surface-2)', borderRadius: '999px' }} />
                    <div style={{ height: '13px', width: '60px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ height: '13px', width: '80px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ height: '11px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                  </div>
                ))
              : tickets.length === 0
              ? (
                <div style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--mute)', fontSize: '13px' }}>
                  No tickets found
                </div>
              )
              : tickets.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display:             'grid',
                    gridTemplateColumns: '32px 90px 1fr 120px 120px 120px 70px',
                    alignItems:          'center',
                    columnGap:           '12px',
                    padding:             '11px 18px',
                    borderBottom:        i < tickets.length - 1 ? '1px solid var(--hairline)' : 'none',
                    cursor:              'pointer',
                    background:          selected.has(t.id) ? 'var(--accent-tint)' : 'transparent',
                    transition:          'background 80ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected.has(t.id)) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = selected.has(t.id) ? 'var(--accent-tint)' : 'transparent';
                  }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'LABEL') return;
                    router.push(`/tickets/${t.id}`);
                  }}
                >
                  <span onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                    {t.id?.slice(0, 8)}
                  </span>
                  <div style={{ minWidth: 0, paddingRight: '8px' }}>
                    <div style={{
                      fontSize:     '13px',
                      color:        'var(--ink)',
                      fontWeight:   500,
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.005em',
                    }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mute)', marginTop: '2px' }}>
                      {t.customer?.name}
                    </div>
                  </div>
                  <span><StatusPill status={t.status} /></span>
                  <span><PriorityBar priority={t.priority} /></span>
                  <span style={{ fontSize: '12px', color: t.assignedTo ? 'var(--ink)' : 'var(--mute)', fontStyle: t.assignedTo ? 'normal' : 'italic' }}>
                    {t.assignedTo?.name ?? 'Unassigned'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'right', fontFeatureSettings: '"tnum"' }}>
                    {timeAgo(t.updatedAt)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Board view */}
      {view === 'board' && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: `repeat(${BOARD_COLS.length}, 1fr)`,
          gap:                 '12px',
          alignItems:          'flex-start',
        }}>
          {BOARD_COLS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col);
            const m = STATUS_META[col];
            return (
              <div
                key={col}
                style={{
                  background:   'var(--surface-2)',
                  borderRadius: '14px',
                  padding:      '10px',
                  minHeight:    '200px',
                  boxShadow:    'var(--shadow-inset)',
                }}
              >
                {/* Column header */}
                <div style={{
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  padding:         '4px 6px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusPill status={col} />
                    <span style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                      {colTickets.length}
                    </span>
                  </div>
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', border: 0, borderRadius: '8px',
                    background: 'transparent', color: 'var(--mute)', cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                    onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--surface-3)'; b.style.color = 'var(--ink)'; }}
                    onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--mute)'; }}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={13} />
                  </button>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {isLoading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} style={{
                          background: 'var(--surface)', borderRadius: '12px',
                          padding: '13px', boxShadow: 'var(--shadow-sm)',
                        }}>
                          <div style={{ height: '11px', background: 'var(--surface-2)', borderRadius: '3px', marginBottom: '10px' }} />
                          <div style={{ height: '26px', background: 'var(--surface-2)', borderRadius: '3px' }} />
                        </div>
                      ))
                    : colTickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => router.push(`/tickets/${t.id}`)}
                          style={{
                            background:   'var(--surface)',
                            borderRadius: '12px',
                            padding:      '13px',
                            cursor:       'pointer',
                            boxShadow:    'var(--shadow-sm)',
                            display:      'flex',
                            flexDirection: 'column',
                            gap:          '8px',
                            transition:   'transform 160ms, box-shadow 160ms',
                          }}
                          onMouseEnter={(e) => {
                            const d = e.currentTarget as HTMLDivElement;
                            d.style.transform  = 'translateY(-2px)';
                            d.style.boxShadow  = 'var(--shadow-md)';
                          }}
                          onMouseLeave={(e) => {
                            const d = e.currentTarget as HTMLDivElement;
                            d.style.transform  = 'translateY(0)';
                            d.style.boxShadow  = 'var(--shadow-sm)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--mute)', fontWeight: 500 }}>
                              {t.id?.slice(0, 8)}
                            </span>
                            <PriorityBar priority={t.priority} />
                          </div>
                          <div style={{
                            fontSize:           '13px',
                            color:              'var(--ink)',
                            fontWeight:         500,
                            lineHeight:         1.35,
                            letterSpacing:      '-0.005em',
                            display:            '-webkit-box',
                            WebkitLineClamp:    2,
                            WebkitBoxOrient:    'vertical',
                            overflow:           'hidden',
                          } as React.CSSProperties}>{t.title}</div>
                          <div style={{
                            display:         'flex',
                            alignItems:      'center',
                            justifyContent:  'space-between',
                            marginTop:       '2px',
                            paddingTop:      '8px',
                            borderTop:       '1px solid var(--hairline)',
                          }}>
                            <span style={{ fontSize: '11px', color: 'var(--mute)' }}>{t.customer?.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--mute)', fontFeatureSettings: '"tnum"' }}>
                              {timeAgo(t.updatedAt)}
                            </span>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && view === 'table' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding:      '6px 14px',
              border:       0,
              background:   'var(--surface-2)',
              color:        page <= 1 ? 'var(--mute)' : 'var(--ink)',
              fontSize:     '12.5px',
              fontWeight:   500,
              borderRadius: '9px',
              cursor:       page <= 1 ? 'not-allowed' : 'pointer',
              boxShadow:    page <= 1 ? 'none' : 'var(--shadow-sm)',
              opacity:      page <= 1 ? 0.5 : 1,
            }}
          >Previous</button>
          <span style={{ fontSize: '12px', color: 'var(--mute)', fontFeatureSettings: '"tnum"' }}>
            Page {page} of {data.meta.totalPages}
          </span>
          <button
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              padding:      '6px 14px',
              border:       0,
              background:   'var(--surface-2)',
              color:        page >= data.meta.totalPages ? 'var(--mute)' : 'var(--ink)',
              fontSize:     '12.5px',
              fontWeight:   500,
              borderRadius: '9px',
              cursor:       page >= data.meta.totalPages ? 'not-allowed' : 'pointer',
              boxShadow:    page >= data.meta.totalPages ? 'none' : 'var(--shadow-sm)',
              opacity:      page >= data.meta.totalPages ? 0.5 : 1,
            }}
          >Next</button>
        </div>
      )}
    </div>
  );
}
