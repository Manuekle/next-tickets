import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'open-tickets — Open Source Ticket Management',
  description: 'Free, self-hostable support ticket management. The modern open-source alternative to Zendesk, Freshdesk, and Jira Service Management.',
};

const FEATURES = [
  { icon: '🎫', title: 'Tickets & Kanban',     desc: 'Table and board views, bulk actions, priority/SLA tracking.' },
  { icon: '⚡', title: 'Automations',           desc: 'Event-driven rules: assign, set status, notify, add tags.' },
  { icon: '📊', title: 'Analytics',             desc: 'Trends, heatmaps, agent performance, SLA compliance.' },
  { icon: '📚', title: 'Knowledge Base',        desc: 'Searchable articles with categories and helpful-vote tracking.' },
  { icon: '🔔', title: 'Real-time Updates',     desc: 'Socket.IO-powered live comments and ticket state sync.' },
  { icon: '🛡️', title: 'Role-based Access',    desc: 'Agent, Admin, Super Admin, and Customer roles built-in.' },
  { icon: '🤖', title: 'SLA Management',        desc: 'Per-priority SLA targets, breach detection, compliance dashboards.' },
  { icon: '⌘K', title: 'Command Palette',       desc: 'Keyboard-first navigation across the entire app.' },
];

const COMPARE = [
  { feature: 'Open source',           ot: true,  zendesk: false, freshdesk: false, jira: false  },
  { feature: 'Self-hostable',         ot: true,  zendesk: false, freshdesk: false, jira: 'Data Center only' },
  { feature: 'Free to use',           ot: true,  zendesk: false, freshdesk: 'Limited', jira: 'Limited' },
  { feature: 'MIT license',           ot: true,  zendesk: false, freshdesk: false, jira: false  },
  { feature: 'Modern UI',             ot: true,  zendesk: 'Dated', freshdesk: 'Dated', jira: 'Complex' },
  { feature: 'Automations',           ot: true,  zendesk: true,  freshdesk: true,  jira: true   },
  { feature: 'Knowledge base',        ot: true,  zendesk: true,  freshdesk: true,  jira: true   },
  { feature: 'SLA management',        ot: true,  zendesk: true,  freshdesk: true,  jira: true   },
  { feature: 'Analytics',             ot: true,  zendesk: true,  freshdesk: true,  jira: true   },
  { feature: 'Real-time (WebSocket)', ot: true,  zendesk: false, freshdesk: false, jira: false  },
  { feature: 'No vendor lock-in',     ot: true,  zendesk: false, freshdesk: false, jira: false  },
  { feature: 'Customize & extend',    ot: true,  zendesk: 'Paid API', freshdesk: 'Paid API', jira: 'Complex' },
];

function Check({ v }: { v: boolean | string }) {
  if (v === true)  return <span style={{ color: 'oklch(0.52 0.18 148)', fontSize: '16px' }}>✓</span>;
  if (v === false) return <span style={{ color: 'oklch(0.72 0.04 270)', fontSize: '15px' }}>—</span>;
  return <span style={{ fontSize: '11px', color: 'oklch(0.60 0.10 50)', fontWeight: 500 }}>{v}</span>;
}

export default function AboutPage() {
  return (
    <div style={{
      minHeight:    '100dvh',
      background:   'var(--bg)',
      fontFamily:   'var(--font-sans, system-ui)',
      position:     'relative',
      overflowX:    'hidden',
    }}>
      {/* Mesh bg */}
        <div style={{
         position:   'fixed',
         inset:      0,
         background: 'radial-gradient(ellipse 80% 60% at 20% -10%, var(--bg-mesh-1) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, var(--bg-mesh-2) 0%, transparent 60%)',
         pointerEvents: 'none',
         zIndex:     0,
       }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', boxShadow: '0 4px 10px -4px color-mix(in oklch, var(--accent) 50%, transparent)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M2 10h4M18 10h4" />
              </svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              open<span style={{ color: 'var(--accent)' }}>-tickets</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a href="https://github.com/Manuekle/next-tickets" target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', fontSize: '13px', fontWeight: 500, color: 'var(--accent)', textDecoration: 'none', borderRadius: '9px', transition: 'background 100ms' }}>
              GitHub
            </a>
            <Link href="/login" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-fg)', textDecoration: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 12px -4px color-mix(in oklch, var(--accent) 40%, transparent)' }}>
              Sign in →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '80px 24px 64px', maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '999px', background: 'var(--accent-tint)', color: 'var(--accent)', marginBottom: '28px', letterSpacing: '0.01em', textTransform: 'uppercase' }}>
            Open Source · MIT License
          </div>
          <h1 style={{ fontSize: 'clamp(42px, 7vw, 72px)', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.0, margin: '0 0 24px' }}>
            Support tickets,
            <br />
            <span style={{ color: 'var(--accent)' }}>finally open.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--mutе)', lineHeight: 1.65, maxWidth: '520px', margin: '0 auto 40px' }}>
            A modern, self-hostable ticket management system. No vendor lock-in, no SaaS pricing, no surprises — just great support tooling you own.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '13px 28px', fontSize: '15px', fontWeight: 600, color: 'var(--accent-fg)', textDecoration: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 6px 20px -6px color-mix(in oklch, var(--accent) 50%, transparent)' }}>
              Get started free
            </Link>
            <a href="https://github.com/Manuekle/next-tickets" target="_blank" rel="noopener noreferrer" style={{ padding: '13px 28px', fontSize: '15px', fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', borderRadius: '12px', background: 'var(--surface)', boxShadow: '0 2px 8px rgba(24,18,8,0.10)' }}>
              View on GitHub
            </a>
          </div>
        </section>

        {/* Features grid */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'oklch(0.18 0.030 270)', letterSpacing: '-0.02em', margin: '0 0 48px' }}>
            Everything a support team needs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.75)', borderRadius: '16px', padding: '22px', boxShadow: '0 2px 12px rgba(24,18,8,0.07)', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '26px', marginBottom: '12px' }}>{f.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'oklch(0.18 0.030 270)', letterSpacing: '-0.005em', marginBottom: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '13px', color: 'oklch(0.52 0.020 270)', lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 100px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'oklch(0.18 0.030 270)', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
            How we compare
          </h2>
          <p style={{ textAlign: 'center', fontSize: '15px', color: 'oklch(0.52 0.020 270)', margin: '0 0 40px' }}>
            vs. Zendesk, Freshdesk, and Jira Service Management
          </p>

          <div style={{ background: 'rgba(255,255,255,0.80)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(24,18,8,0.10)', backdropFilter: 'blur(8px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'oklch(0.16 0.040 275)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'oklch(0.80 0.030 275)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature</th>
                  {[
                    { name: 'open-tickets', highlight: true },
                    { name: 'Zendesk',       highlight: false },
                    { name: 'Freshdesk',     highlight: false },
                    { name: 'Jira SM',       highlight: false },
                  ].map((col) => (
                    <th key={col.name} style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: col.highlight ? 'oklch(0.80 0.15 275)' : 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.feature} style={{ borderTop: i === 0 ? 'none' : '1px solid oklch(0.94 0.010 270)' }}>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: 'oklch(0.30 0.028 270)', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', background: 'oklch(0.94 0.04 275 / 0.25)' }}><Check v={row.ot} /></td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}><Check v={row.zendesk} /></td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}><Check v={row.freshdesk} /></td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}><Check v={row.jira} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '0 24px 100px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.75)', borderRadius: '24px', padding: '56px 72px', boxShadow: '0 8px 32px rgba(24,18,8,0.10)', backdropFilter: 'blur(8px)', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'oklch(0.18 0.030 270)', letterSpacing: '-0.02em', margin: '0 0 16px' }}>
              Deploy it yourself
            </h2>
            <p style={{ fontSize: '15px', color: 'oklch(0.52 0.020 270)', lineHeight: 1.65, margin: '0 0 32px' }}>
              One monorepo, Next.js + Node.js. Runs anywhere — Vercel, Railway, fly.io, or your own VPS. Full source on GitHub.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--accent-fg)', textDecoration: 'none', borderRadius: '11px', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 16px -4px color-mix(in oklch, var(--accent) 40%, transparent)' }}>
                Start for free
              </Link>
              <a href="https://github.com/Manuekle/next-tickets" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, color: 'oklch(0.30 0.028 270)', textDecoration: 'none', borderRadius: '11px', background: 'rgba(255,255,255,0.80)', boxShadow: '0 2px 8px rgba(24,18,8,0.10)' }}>
                Read the docs
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '20px 24px 40px', fontSize: '12px', color: 'oklch(0.62 0.020 270)' }}>
          open-tickets · MIT License · Built with Next.js & Node.js
        </footer>
      </div>
    </div>
  );
}
