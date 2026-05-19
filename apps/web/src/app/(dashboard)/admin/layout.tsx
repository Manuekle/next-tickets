'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/admin',          label: 'Users'      },
  { href: '/admin/logs',     label: 'Audit Logs' },
  { href: '/admin/settings', label: 'Settings'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>
          Admin Panel
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mute)', marginTop: '6px' }}>
          System management and configuration
        </p>
      </div>
      <nav style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--ink)' : 'var(--mute)',
                textDecoration: 'none',
                borderRadius: '8px 8px 0 0',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 100ms',
                marginBottom: '-1px',
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
