'use client';
export const dynamic = 'force-dynamic';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import {
  Inbox, Clock, AlertTriangle, CheckCircle,
  Plus, Zap, ArrowRight, User, ArrowRightLeft, MessageSquare, Tag,
} from 'lucide-react';

interface DashboardStats {
  openCount: number;
  closedCount: number;
  pendingCount: number;
  avgFirstResponseHours: number | null;
  byPriority: { priority: string; count: number }[];
  byCategory: { name: string; count: number }[];
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: { name: string; hue?: number };
  assignedTo?: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}

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
      gap:          '6px',
      padding:      '3px 9px 3px 7px',
      fontSize:     '11.5px',
      fontWeight:   600,
      letterSpacing: '-0.005em',
      borderRadius: '999px',
      background:   `oklch(0.93 ${m.dotChroma * 0.32} ${m.hue})`,
      color:        `oklch(0.32 ${m.dotChroma} ${m.hue})`,
      whiteSpace:   'nowrap',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '999px',
        background: `oklch(0.54 ${m.dotChroma * 1.1} ${m.hue})`,
        boxShadow: `0 0 0 2px color-mix(in oklch, oklch(0.54 ${m.dotChroma * 1.1} ${m.hue}) 12%, transparent)`,
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: 'var(--ink)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} style={{
            width:        '3.5px',
            height:       `${4 + i * 2.5}px`,
            borderRadius: '1.5px',
            background:   i <= lvl ? `oklch(0.60 0.20 ${m.hue})` : 'var(--surface-3)',
            boxShadow:    i <= lvl ? `0 0 4px color-mix(in oklch, oklch(0.60 0.20 ${m.hue}) 50%, transparent)` : 'none',
          }} />
        ))}
      </span>
      <span style={{ fontSize: '11.5px' }}>{m.label}</span>
    </span>
  );
}

function KpiCard({
  label, value, delta, deltaTone, trend, tone, icon, onClick,
}: {
  label: string; value: number | string; delta: string;
  deltaTone: 'info' | 'ok' | 'warn' | 'muted';
  trend: number[]; tone: string; icon: React.ReactNode;
  onClick?: () => void;
}) {
  const toneMap: Record<string, { hue: number; valueColor: string }> = {
    indigo:  { hue: 275, valueColor: 'oklch(0.30 0.25 275)' },
    amber:   { hue:  60, valueColor: 'oklch(0.32 0.16 60)'  },
    rose:    { hue:  18, valueColor: 'oklch(0.34 0.24 18)'  },
    emerald: { hue: 155, valueColor: 'oklch(0.32 0.16 155)' },
    neutral: { hue: 275, valueColor: 'var(--ink)'            },
  };
  const tn = toneMap[tone] ?? toneMap.neutral;
  const deltaColor = {
    info:  'oklch(0.48 0.22 245)',
    ok:    'oklch(0.46 0.18 155)',
    warn:  'oklch(0.52 0.22 22)',
    muted: 'var(--mute)',
  }[deltaTone];

  const w = 120, h = 32;
  const maxV  = Math.max(...trend, 1);
  const stepX = w / Math.max(trend.length - 1, 1);
  const pts   = trend.map((v, i) => [i * stepX, h - (v / maxV) * (h - 4) - 2] as [number, number]);
  const path  = 'M ' + pts.map((p) => p.join(',')).join(' L ');
  const area  = path + ` L ${w},${h} L 0,${h} Z`;
  const uid   = `kpi-${tone}-${label}`.replace(/\s/g, '');

  return (
    <button
      onClick={onClick}
      style={{
        padding:        '18px',
        textAlign:      'left',
        cursor:         onClick ? 'pointer' : 'default',
        display:        'flex',
        flexDirection:  'column',
        gap:            '4px',
        position:       'relative',
        overflow:       'hidden',
        background:     tone === 'neutral'
          ? 'var(--surface)'
          : `linear-gradient(135deg, oklch(0.92 0.14 ${tn.hue}) 0%, oklch(0.96 0.07 ${tn.hue}) 60%, var(--surface) 110%)`,
        border:         0,
        borderRadius:   '16px',
        boxShadow:      tone === 'neutral'
          ? 'var(--shadow-md)'
          : `var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.6)`,
        transition:     'transform 160ms, box-shadow 160ms',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.transform  = 'translateY(-2px)';
          b.style.boxShadow  = 'var(--shadow-lg)';
        }
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.transform = 'translateY(0)';
        b.style.boxShadow = tone === 'neutral' ? 'var(--shadow-md)' : `var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.6)`;
      }}
    >
      {tone !== 'neutral' && (
        <span aria-hidden style={{
          position: 'absolute', top: '-36px', right: '-36px',
          width: '140px', height: '140px', borderRadius: '999px',
          background: `radial-gradient(circle, oklch(0.62 0.26 ${tn.hue}) 0%, transparent 70%)`,
          opacity: 0.32, filter: 'blur(6px)', pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{
          fontSize:      '12px',
          fontWeight:    600,
          letterSpacing: '-0.005em',
          color:         tone === 'neutral' ? 'var(--mute)' : `oklch(0.38 0.18 ${tn.hue})`,
        }}>{label}</div>
        {icon && (
          <span style={{
            display:         'inline-flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '28px',
            height:          '28px',
            borderRadius:    '9px',
            background:      tone === 'neutral' ? 'var(--surface-2)' : `oklch(0.62 0.22 ${tn.hue})`,
            color:           tone === 'neutral' ? 'var(--mute)' : '#fff',
            boxShadow:       tone === 'neutral' ? 'var(--shadow-inset)' : `0 4px 10px -4px color-mix(in oklch, oklch(0.62 0.22 ${tn.hue}) 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}>{icon}</span>
        )}
      </div>

      <div style={{
        fontSize:       '42px',
        fontWeight:     500,
        color:          tn.valueColor,
        letterSpacing:  '-0.035em',
        lineHeight:     1,
        fontFamily:     'var(--font-display)',
        marginTop:      '6px',
        fontFeatureSettings: '"tnum"',
        position:       'relative',
      }}>{value}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', position: 'relative' }}>
        <span style={{ fontSize: '11.5px', color: deltaColor, fontWeight: 600, letterSpacing: '-0.005em' }}>{delta}</span>
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={`oklch(0.55 0.24 ${tn.hue})`} stopOpacity="0.38" />
              <stop offset="1" stopColor={`oklch(0.55 0.24 ${tn.hue})`} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${uid})`} />
          <path d={path} fill="none" stroke={`oklch(0.50 0.26 ${tn.hue})`} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  );
}

function Card({ children, padded = true, style }: { children: React.ReactNode; padded?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   'var(--surface)',
      borderRadius: '16px',
      boxShadow:    'var(--shadow-md)',
      padding:      padded ? '20px' : 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, count, action, actionLabel }: {
  title: string; count?: number; action?: () => void; actionLabel?: string;
}) {
  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '14px 18px',
      borderBottom:    '1px solid var(--hairline)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', margin: 0 }}>{title}</h3>
        {count != null && (
          <span style={{
            fontSize:    '11px',
            color:       'var(--mute)',
            padding:     '2px 8px',
            background:  'var(--surface-2)',
            borderRadius: '6px',
            fontFeatureSettings: '"tnum"',
          }}>{count}</span>
        )}
      </div>
      {action && (
        <button
          onClick={action}
          style={{
            fontSize:      '12px',
            color:         'var(--accent)',
            background:    'transparent',
            border:        0,
            cursor:        'pointer',
            display:       'flex',
            alignItems:    'center',
            gap:           '4px',
            fontWeight:    500,
          }}
        >
          {actionLabel ?? 'View all'} <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

const SPARK = [8, 11, 9, 13, 10, 15, 12, 14, 11, 16, 13, 17, 14, 18];

export default function DashboardPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient<{ data: DashboardStats }>('/analytics/stats'),
  });

  const { data: ticketsRes } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => apiClient<{ data: Ticket[] }>('/tickets', { params: { limit: '6', status: 'OPEN' } }),
  });

  const stats   = data?.data;
  const tickets = ticketsRes?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
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
            Inbox
          </div>
          <h1 style={{
            fontSize:      '40px',
            fontWeight:    400,
            color:         'var(--ink)',
            letterSpacing: '-0.025em',
            lineHeight:    1.0,
            margin:        0,
            fontFamily:    'var(--font-display)',
          }}>
            Good afternoon, {firstName}.
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mute)', marginTop: '10px', lineHeight: 1.5 }}>
            {isLoading ? 'Loading your queue…' : `${stats?.openCount ?? 0} open tickets · ${stats?.pendingCount ?? 0} pending response`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, paddingTop: '6px' }}>
          <button
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '7px',
              padding:       '8px 14px',
              border:        0,
              background:    'var(--surface-2)',
              color:         'var(--ink)',
              fontSize:      '13px',
              fontWeight:    500,
              borderRadius:  '10px',
              cursor:        'pointer',
              boxShadow:     'var(--shadow-sm), var(--shadow-inset)',
              transition:    'all 120ms',
            }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--surface-3)'; b.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--surface-2)'; b.style.transform = 'translateY(0)'; }}
          >
            <Zap size={14} />
            Triage with AI
          </button>
          <button
            onClick={() => router.push('/tickets/new')}
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '7px',
              padding:       '8px 14px',
              border:        0,
              background:    'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color:         'var(--accent-fg)',
              fontSize:      '13px',
              fontWeight:    500,
              borderRadius:  '10px',
              cursor:        'pointer',
              boxShadow:     'inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 14px -4px var(--accent-glow)',
              transition:    'all 120ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 24px -6px var(--accent-glow)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 14px -4px var(--accent-glow)'; }}
          >
            <Plus size={14} />
            New ticket
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <KpiCard
          label="Open"
          value={isLoading ? '…' : stats?.openCount ?? 0}
          delta="+4 today"
          deltaTone="info"
          trend={SPARK}
          tone="indigo"
          icon={<Inbox size={13} />}
          onClick={() => router.push('/tickets?status=OPEN')}
        />
        <KpiCard
          label="In progress"
          value={isLoading ? '…' : stats?.pendingCount ?? 0}
          delta="−1 vs yesterday"
          deltaTone="ok"
          trend={SPARK.map((v) => Math.max(0, v - 2))}
          tone="amber"
          icon={<Clock size={13} />}
          onClick={() => router.push('/tickets?status=IN_PROGRESS')}
        />
        <KpiCard
          label="SLA at risk"
          value={isLoading ? '…' : Math.ceil((stats?.openCount ?? 0) * 0.15)}
          delta="2 critical"
          deltaTone="warn"
          trend={SPARK.map((v) => Math.max(0, Math.round(v * 0.4)))}
          tone="rose"
          icon={<AlertTriangle size={13} />}
        />
        <KpiCard
          label="Resolved today"
          value={isLoading ? '…' : stats?.closedCount ?? 0}
          delta={stats?.avgFirstResponseHours ? `Avg ${stats.avgFirstResponseHours.toFixed(1)}h` : 'Avg —'}
          deltaTone="muted"
          trend={SPARK.map((v) => v - 3)}
          tone="emerald"
          icon={<CheckCircle size={13} />}
        />
      </div>

      {/* Assigned tickets + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
        <Card padded={false}>
          <SectionHeader
            title="Open tickets"
            count={tickets.length}
            action={() => router.push('/tickets')}
          />
          <div>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{
                    padding:     '11px 18px',
                    borderTop:   i === 0 ? 'none' : '1px solid var(--hairline)',
                    display:     'flex',
                    gap:         '12px',
                    alignItems:  'center',
                  }}>
                    <div style={{ width: '60px', height: '12px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ flex: 1, height: '12px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                    <div style={{ width: '60px', height: '20px', background: 'var(--surface-2)', borderRadius: '999px' }} />
                  </div>
                ))
              : tickets.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--mute)', fontSize: '13px' }}>
                  No open tickets 🎉
                </div>
              ) : tickets.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/tickets/${t.id}`)}
                  style={{
                    display:             'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems:          'center',
                    gap:                 '12px',
                    padding:             '11px 18px',
                    borderTop:           i === 0 ? 'none' : '1px solid var(--hairline)',
                    cursor:              'pointer',
                    transition:          'background 100ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mute)' }}>
                    {t.id?.slice(0, 8)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize:       '13px',
                      color:          'var(--ink)',
                      fontWeight:     500,
                      whiteSpace:     'nowrap',
                      overflow:       'hidden',
                      textOverflow:   'ellipsis',
                      letterSpacing:  '-0.005em',
                    }}>{t.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      {t.category && (
                        <span style={{
                          display:      'inline-flex',
                          alignItems:   'center',
                          gap:          '5px',
                          padding:      '2px 8px',
                          fontSize:     '11px',
                          fontWeight:   600,
                          borderRadius: '6px',
                          background:   `oklch(0.94 0.05 ${t.category.hue ?? 265})`,
                          color:        `oklch(0.34 0.15 ${t.category.hue ?? 265})`,
                        }}>
                          {t.category.name}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--mute)' }}>{timeAgo(t.updatedAt)} ago</span>
                    </div>
                  </div>
                  <PriorityBar priority={t.priority} />
                  <StatusPill status={t.status} />
                </div>
              ))}
          </div>
        </Card>

        {/* Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* By priority */}
          <Card padded={false} style={{ flex: 1 }}>
            <SectionHeader title="By priority" />
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '60px', height: '10px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                      <div style={{ flex: 1, height: '6px', background: 'var(--surface-2)', borderRadius: '999px' }} />
                    </div>
                  ))
                : (stats?.byPriority ?? []).map((p) => {
                    const meta = PRIORITY_META[p.priority];
                    const total = (stats?.byPriority ?? []).reduce((s, x) => s + x.count, 0) || 1;
                    if (!meta) return null;
                    return (
                      <div key={p.priority} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '68px', flexShrink: 0 }}>
                          <PriorityBar priority={p.priority} />
                        </div>
                        <div style={{
                          flex: 1, height: '6px', background: 'var(--surface-2)',
                          borderRadius: '999px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width:  `${(p.count / total) * 100}%`,
                            background: `oklch(0.62 0.16 ${meta.hue})`,
                            borderRadius: '999px',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 600, width: '20px', textAlign: 'right', fontFeatureSettings: '"tnum"' }}>{p.count}</span>
                      </div>
                    );
                  })
              }
            </div>
          </Card>

          {/* By category */}
          <Card padded={false} style={{ flex: 1 }}>
            <SectionHeader title="By category" />
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '70px', height: '10px', background: 'var(--surface-2)', borderRadius: '4px' }} />
                      <div style={{ flex: 1, height: '6px', background: 'var(--surface-2)', borderRadius: '999px' }} />
                    </div>
                  ))
                : (stats?.byCategory ?? []).slice(0, 5).map((c, idx) => {
                    const hue   = [265, 28, 200, 12, 155, 80][idx % 6];
                    const total = (stats?.byCategory ?? []).reduce((s, x) => s + x.count, 0) || 1;
                    return (
                      <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          display:      'inline-flex',
                          alignItems:   'center',
                          gap:          '5px',
                          padding:      '2px 8px',
                          fontSize:     '11px',
                          fontWeight:   600,
                          borderRadius: '6px',
                          background:   `oklch(0.94 0.05 ${hue})`,
                          color:        `oklch(0.34 0.15 ${hue})`,
                          width:        '90px',
                          flexShrink:   0,
                          whiteSpace:   'nowrap',
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {c.name}
                        </span>
                        <div style={{
                          flex: 1, height: '6px', background: 'var(--surface-2)',
                          borderRadius: '999px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width:  `${(c.count / total) * 100}%`,
                            background: `oklch(0.62 0.16 ${hue})`,
                            borderRadius: '999px',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 600, width: '20px', textAlign: 'right', fontFeatureSettings: '"tnum"' }}>{c.count}</span>
                      </div>
                    );
                  })
              }
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
