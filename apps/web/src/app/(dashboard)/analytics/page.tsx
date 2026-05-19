'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { TrendingUp, Users, Calendar, Shield, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart } from '@/components/analytics/bar-chart';
import { Heatmap } from '@/components/analytics/heatmap';

interface TrendDay {
  date: string;
  created: number;
  resolved: number;
  open: number;
  critical: number;
}

interface TrendsResponse {
  data: TrendDay[];
  totals: { created: number; resolved: number; open: number; critical: number };
}

interface AgentRow {
  name: string;
  assigned: number;
  resolved: number;
  comments: number;
  avgResponseTimeHours: number | null;
}

interface AgentsResponse {
  data: AgentRow[];
}

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface HeatmapResponse {
  data: HeatmapCell[];
}

interface SLAResponse {
  data: {
    complianceRate: number;
    total: number;
    compliant: number;
    breached: number;
  };
}

const DAY_RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
] as const;

const TABS = [
  { key: 'trends',  label: 'Trends',  icon: TrendingUp },
  { key: 'agents',  label: 'Agents',  icon: Users      },
  { key: 'heatmap', label: 'Heatmap', icon: Calendar   },
  { key: 'sla',     label: 'SLA',     icon: Shield     },
] as const;

/* ─── small primitives ─── */

function Card({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return (
    <div style={{
      background:   'var(--surface)',
      borderRadius: '16px',
      boxShadow:    'var(--shadow-md)',
      overflow:     'hidden',
      padding:      padded ? '20px' : 0,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      justifyContent:'space-between',
      padding:       '14px 20px',
      borderBottom:  '1px solid var(--hairline)',
    }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</span>
      {right}
    </div>
  );
}

function StatCard({ title, value, loading, tone = 'ink' }: {
  title: string; value?: number | string; loading: boolean; tone?: string;
}) {
  return (
    <Card>
      <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>{title}</div>
      {loading ? (
        <div style={{ height: '32px', width: '60px', background: 'var(--surface-2)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ) : (
        <div style={{ fontSize: '30px', fontFamily: 'var(--font-display)', fontWeight: 400, color: `var(--${tone})`, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value ?? 0}
        </div>
      )}
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', fontSize: '13px', color: 'oklch(0.50 0.20 22)' }}>
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', fontSize: '13px', color: 'var(--mute)' }}>
      {message}
    </div>
  );
}

/* ─── Trends tab ─── */

function TrendsTab() {
  const [days, setDays] = useState('30');
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-trends', days],
    queryFn: () => apiClient<TrendsResponse>(`/analytics/trends?days=${days}`),
  });

  if (error) return <ErrorState message="Failed to load trends" />;
  const totals = data?.totals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Range selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {DAY_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setDays(r.value)}
            style={{
              padding:      '5px 12px',
              fontSize:     '12px',
              fontWeight:   days === r.value ? 600 : 500,
              border:       0,
              borderRadius: '8px',
              cursor:       'pointer',
              transition:   'all 100ms',
              background:   days === r.value ? 'var(--accent-tint)' : 'var(--surface-2)',
              color:        days === r.value ? 'var(--accent)' : 'var(--ink-soft)',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard title="Created"  value={totals?.created}  loading={isLoading} />
        <StatCard title="Resolved" value={totals?.resolved} loading={isLoading} />
        <StatCard title="Open"     value={totals?.open}     loading={isLoading} />
        <StatCard title="Critical" value={totals?.critical} loading={isLoading} tone="mute" />
      </div>

      {/* Charts */}
      <Card padded={false}>
        <CardHead title="Created vs Resolved" />
        <div style={{ padding: '20px' }}>
          {isLoading ? (
            <div style={{ height: '180px', background: 'var(--surface-2)', borderRadius: '10px' }} />
          ) : data?.data && data.data.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Created</div>
                <BarChart data={data.data.map((d) => ({ label: d.date, value: d.created }))} height={180} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Resolved</div>
                <BarChart data={data.data.map((d) => ({ label: d.date, value: d.resolved }))} height={180} />
              </div>
            </div>
          ) : (
            <EmptyState message="No trend data available" />
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─── Agents tab ─── */

function AgentsTab() {
  const [sortKey, setSortKey] = useState<keyof AgentRow>('resolved');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-agents'],
    queryFn: () => apiClient<AgentsResponse>('/analytics/agents'),
  });

  const handleSort = (key: keyof AgentRow) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...(data?.data ?? [])].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const cols: { key: keyof AgentRow; label: string }[] = [
    { key: 'name',                 label: 'Name'         },
    { key: 'assigned',             label: 'Assigned'     },
    { key: 'resolved',             label: 'Resolved'     },
    { key: 'comments',             label: 'Comments'     },
    { key: 'avgResponseTimeHours', label: 'Avg Response' },
  ];

  if (error) return <ErrorState message="Failed to load agent data" />;

  return (
    <Card padded={false}>
      <CardHead title="Agent Performance" />
      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{ height: '32px', background: 'var(--surface-2)', borderRadius: '8px' }} />
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {cols.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding:       '10px 18px',
                      textAlign:     'left',
                      fontSize:      '11px',
                      fontWeight:    600,
                      color:         sortKey === col.key ? 'var(--ink)' : 'var(--mute)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor:        'pointer',
                      whiteSpace:    'nowrap',
                      userSelect:    'none',
                      borderBottom:  '1px solid var(--hairline)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} style={{ opacity: 0.4 }} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((agent, i) => (
                <tr
                  key={agent.name}
                  style={{ borderBottom: i === sorted.length - 1 ? 'none' : '1px solid var(--hairline)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500 }}>{agent.name}</td>
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: 'var(--ink)', fontFeatureSettings: '"tnum"' }}>{agent.assigned}</td>
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: 'var(--ink)', fontFeatureSettings: '"tnum"' }}>{agent.resolved}</td>
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: 'var(--ink)', fontFeatureSettings: '"tnum"' }}>{agent.comments}</td>
                  <td style={{ padding: '11px 18px', fontSize: '12px', color: 'var(--mute)' }}>
                    {agent.avgResponseTimeHours != null ? `${agent.avgResponseTimeHours.toFixed(1)}h` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No agent data available" />
        )}
      </div>
    </Card>
  );
}

/* ─── Heatmap tab ─── */

function HeatmapTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-heatmap'],
    queryFn: () => apiClient<HeatmapResponse>('/analytics/heatmap'),
  });

  if (error) return <ErrorState message="Failed to load heatmap" />;

  return (
    <Card padded={false}>
      <CardHead title="Ticket Volume by Day / Hour" />
      <div style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ height: '220px', background: 'var(--surface-2)', borderRadius: '10px' }} />
        ) : data?.data && data.data.length > 0 ? (
          <Heatmap data={data.data} />
        ) : (
          <EmptyState message="No heatmap data available" />
        )}
      </div>
    </Card>
  );
}

/* ─── SLA tab ─── */

function SLATab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-sla'],
    queryFn: () => apiClient<SLAResponse>('/analytics/sla'),
  });

  if (error) return <ErrorState message="Failed to load SLA data" />;
  const sla = data?.data;

  const pct = sla ? Math.round(sla.complianceRate * 100) : 0;
  const R = 56, C = 2 * Math.PI * R;
  void C;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {isLoading ? (
          [1,2,3].map((i) => (
            <Card key={i}>
              <div style={{ height: '40px', background: 'var(--surface-2)', borderRadius: '8px' }} />
            </Card>
          ))
        ) : (
          <>
            <Card>
              <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Compliance Rate</div>
              <div style={{ fontSize: '30px', fontFamily: 'var(--font-display)', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {sla ? `${pct}%` : 'N/A'}
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Compliant</div>
              <div style={{ fontSize: '30px', fontFamily: 'var(--font-display)', color: 'oklch(0.52 0.18 155)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {sla?.compliant ?? 0}
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: '11px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Breached</div>
              <div style={{ fontSize: '30px', fontFamily: 'var(--font-display)', color: 'oklch(0.50 0.20 22)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {sla?.breached ?? 0}
              </div>
            </Card>
          </>
        )}
      </div>

      <Card padded={false}>
        <CardHead title="SLA Overview" />
        <div style={{ padding: '20px' }}>
          {isLoading ? (
            <div style={{ height: '64px', background: 'var(--surface-2)', borderRadius: '10px' }} />
          ) : sla ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Gauge arc */}
              <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '130px', height: '100px', flexShrink: 0 }}>
                  <svg width="130" height="100" viewBox="0 0 130 100">
                    <defs>
                      <linearGradient id="gauge-bg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="oklch(0.92 0.03 155)" />
                        <stop offset="0.5" stopColor="oklch(0.92 0.04 70)" />
                        <stop offset="1" stopColor="oklch(0.92 0.04 22)" />
                      </linearGradient>
                      <linearGradient id="gauge-fg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0"   stopColor="oklch(0.62 0.18 155)" />
                        <stop offset="0.7" stopColor="oklch(0.65 0.18 70)" />
                        <stop offset="1"   stopColor="oklch(0.60 0.20 22)" />
                      </linearGradient>
                    </defs>
                    <path d="M 12 88 A 53 53 0 1 1 118 88" fill="none" stroke="url(#gauge-bg)" strokeWidth="10" strokeLinecap="round" />
                    <path
                      d="M 12 88 A 53 53 0 1 1 118 88"
                      fill="none" stroke="url(#gauge-fg)" strokeWidth="10" strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - pct}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    paddingBottom: '4px',
                  }}>
                    <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {pct}<span style={{ fontSize: '14px', color: 'var(--mute)' }}>%</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                      within SLA
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { color: 'oklch(0.62 0.18 155)', label: 'On track',   value: sla.compliant },
                    { color: 'oklch(0.65 0.18 70)',  label: 'At risk',    value: Math.max(0, sla.total - sla.compliant - sla.breached) },
                    { color: 'oklch(0.60 0.20 22)',  label: 'Breached',   value: sla.breached  },
                  ].map(({ color, label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: color, display: 'inline-block' }} />
                        <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{label}</span>
                      </div>
                      <span style={{ color: 'var(--ink)', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--mute)' }}>
                  <span>Total: <strong style={{ color: 'var(--ink)' }}>{sla.total}</strong></span>
                  <span>{sla.compliant} compliant · {sla.breached} breached</span>
                </div>
                <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'var(--surface-2)' }}>
                  <div style={{ background: 'oklch(0.62 0.18 155)', width: `${(sla.compliant / Math.max(sla.total, 1)) * 100}%`, transition: 'width 400ms ease' }} />
                  <div style={{ background: 'oklch(0.60 0.20 22)', width: `${(sla.breached / Math.max(sla.total, 1)) * 100}%`, transition: 'width 400ms ease' }} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="No SLA data available" />
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─── Export button ─── */

function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API}/analytics/export/csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open('/api/analytics/export/csv', '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '6px',
        padding:      '8px 14px',
        fontSize:     '13px',
        fontWeight:   500,
        border:       0,
        borderRadius: '10px',
        background:   'var(--surface-2)',
        color:        loading ? 'var(--mute)' : 'var(--ink-soft)',
        cursor:       loading ? 'not-allowed' : 'pointer',
        boxShadow:    'var(--shadow-sm)',
        transition:   'all 120ms',
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
    >
      <Download size={14} />
      Export CSV
    </button>
  );
}

/* ─── Page ─── */

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'trends' | 'agents' | 'heatmap' | 'sla'>('trends');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize:      '36px',
            fontFamily:    'var(--font-display)',
            fontWeight:    400,
            color:         'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight:    1.05,
            margin:        0,
          }}>
            Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>
            Insights and metrics for your support queue
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface-2)', borderRadius: '12px', alignSelf: 'flex-start' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '7px 14px',
                fontSize:     '13px',
                fontWeight:   active ? 600 : 500,
                border:       0,
                borderRadius: '9px',
                cursor:       'pointer',
                transition:   'all 100ms',
                background:   active ? 'var(--surface)' : 'transparent',
                color:        active ? 'var(--ink)' : 'var(--mute)',
                boxShadow:    active ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'trends'  && <TrendsTab />}
      {tab === 'agents'  && <AgentsTab />}
      {tab === 'heatmap' && <HeatmapTab />}
      {tab === 'sla'     && <SLATab />}
    </div>
  );
}
