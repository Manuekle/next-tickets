'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@heroui/react';
import {
  LayoutDashboard, Ticket, BookOpen, BarChart3, Settings, ChevronLeft, Workflow, Gauge, Shield,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
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
    <aside className="flex flex-col border-r border-default-200 bg-surface transition-all duration-200 h-dvh sticky top-0">
      <div className="flex h-14 items-center gap-2 border-b border-default-200 px-3">
        {!collapsed && (
          <Link href="/" className="flex-1 text-base font-semibold tracking-tight truncate">
            next<span className="text-accent">tickets</span>
          </Link>
        )}
        <Button
          variant="ghost"
          isIconOnly
          size="sm"
          className="shrink-0"
          onPress={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      <nav aria-label="Main navigation" className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-foreground'
                  : 'text-default-500 hover:bg-default-100 hover:text-foreground'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
