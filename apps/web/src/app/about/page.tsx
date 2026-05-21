import Link from 'next/link';
import GitHubStars from '@/components/github-stars';
import Logo from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
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
  if (v === true)  return <span className="text-base text-success">✓</span>;
  if (v === false) return <span className="text-[15px] text-mute-soft">—</span>;
  return <span className="text-[11px] font-medium text-warning">{v}</span>;
}

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-bg">
      {/* Nav */}
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-12 py-[18px]">
        <Logo size={32} showText textSize="15px" />
        <div className="flex items-center gap-2">
          <GitHubStars />
          <Link href="/login" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
            Sign in →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-[820px] px-6 pb-16 pt-20 text-center">
        <Badge variant="neutral" className="mb-7 px-3 py-1 text-xs uppercase tracking-wide">
          Open Source · MIT License
        </Badge>
        <h1 className="m-0 mb-6 text-[clamp(42px,7vw,72px)] font-bold leading-none tracking-tight text-ink">
          Support tickets,
          <br />
          finally open.
        </h1>
        <p className="mx-auto mb-10 max-w-[520px] text-lg leading-relaxed text-mute">
          A modern, self-hostable ticket management system. No vendor lock-in, no SaaS pricing, no surprises — just great support tooling you own.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
            Get started free
          </Link>
          <a
            href="https://github.com/Manuekle/next-tickets"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-[1100px] px-6 pb-20">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-ink">
          Everything a support team needs
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-[22px]">
              <div className="mb-3 text-2xl">{f.icon}</div>
              <div className="mb-1.5 text-sm font-semibold text-ink">{f.title}</div>
              <div className="text-[13px] leading-relaxed text-mute">{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-[1100px] px-6 pb-24">
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tight text-ink">
          How we compare
        </h2>
        <p className="mb-10 text-center text-[15px] text-mute">
          vs. Zendesk, Freshdesk, and Jira Service Management
        </p>

        <Card className="overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-mute">Feature</th>
                {[
                  { name: 'open-tickets', highlight: true },
                  { name: 'Zendesk',       highlight: false },
                  { name: 'Freshdesk',     highlight: false },
                  { name: 'Jira SM',       highlight: false },
                ].map((col) => (
                  <th
                    key={col.name}
                    className={`px-5 py-3.5 text-center text-[13px] font-bold tracking-tight ${col.highlight ? 'text-ink' : 'text-mute'}`}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.feature} className={i === 0 ? '' : 'border-t border-border'}>
                  <td className="px-5 py-3 text-[13px] font-medium text-ink-soft">{row.feature}</td>
                  <td className="bg-surface-2 px-5 py-3 text-center"><Check v={row.ot} /></td>
                  <td className="px-5 py-3 text-center"><Check v={row.zendesk} /></td>
                  <td className="px-5 py-3 text-center"><Check v={row.freshdesk} /></td>
                  <td className="px-5 py-3 text-center"><Check v={row.jira} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <Card className="inline-block max-w-[600px] px-[72px] py-14">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-ink">
            Deploy it yourself
          </h2>
          <p className="mb-8 text-[15px] leading-relaxed text-mute">
            One monorepo, Next.js + Node.js. Runs anywhere — Vercel, Railway, fly.io, or your own VPS. Full source on GitHub.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              Start for free
            </Link>
            <a
              href="https://github.com/Manuekle/next-tickets"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              View source
            </a>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10 pt-5 text-center text-xs text-mute">
        open-tickets · MIT License · Built with Next.js & Node.js
      </footer>
    </div>
  );
}
