'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/admin',          label: 'Users'      },
  { href: '/admin/logs',     label: 'Audit Logs' },
  { href: '/admin/settings', label: 'Settings'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-ink">Admin Panel</h1>
        <p className="mt-1.5 text-xs text-mute">System management and configuration</p>
      </div>
      <nav className="flex gap-0.5 border-b border-border">
        {tabs.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                '-mb-px border-b-2 px-4 py-2 text-[13px] transition-colors',
                active
                  ? 'border-accent font-semibold text-ink'
                  : 'border-transparent font-medium text-mute hover:text-ink-soft',
              )}
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
