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
    <aside
      className={`flex flex-col border-r border-[#DFE1E6] bg-[#ffffff] transition-all duration-200 h-dvh sticky top-0 ${collapsed ? 'w-14' : 'w-60'}`}
    >
      <div className="flex h-14 items-center gap-2 border-b border-[#DFE1E6] px-3">
        {!collapsed && (
          <Link href="/" className="flex-1 text-base font-bold tracking-tight text-[#172B4D] truncate">
            next<span className="text-[#0052CC]">tickets</span>
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
          <ChevronLeft className={`h-4 w-4 text-[#6B778C] transition-transform ${collapsed ? 'rotate-180' : ''}`} />
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
              className={`flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0052CC]/10 text-[#0052CC] border-l-[3px] border-[#0052CC] ml-0 pl-[9px]'
                  : 'text-[#6B778C] hover:bg-[#f4f5f7] hover:text-[#172B4D]'
              } ${collapsed ? 'justify-center px-2 border-l-0 ml-0' : 'ml-0'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#0052CC]' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
