'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Ticket, BookOpen, BarChart3, Settings, ChevronLeft, Workflow, Gauge, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems: { href: string; label: string; icon: any; disabled?: boolean }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/sla', label: 'SLA', icon: Gauge },
  { href: '/automations', label: 'Automations', icon: Workflow },
  { href: '/admin', label: 'Admin', icon: Shield },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'flex flex-col border-r bg-card transition-all duration-200',
      collapsed ? 'w-16' : 'w-56',
    )}>
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <Link href="/" className="text-lg font-bold tracking-tight">
            next<span className="text-primary">tickets</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto h-8 w-8', collapsed && 'mx-auto')}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>
      <nav role="navigation" aria-label="Main navigation" className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.disabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                item.disabled && 'cursor-not-allowed opacity-50',
                collapsed && 'justify-center px-2',
              )}
              {...(item.disabled ? { onClick: (e) => e.preventDefault() } : {})}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
