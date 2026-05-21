'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="hx-layout">
      {/* Desktop sidebar */}
      <div className="hx-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          role="dialog"
          aria-label="Navigation menu"
          aria-modal="true"
          onClick={closeSidebar}
          className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[3px]"
        >
          <div
            className="h-full w-[268px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={closeSidebar} />
          </div>
        </div>
      )}

      {/* Main area */}
      <main className="hx-main" id="main-content">
        <a
          href="#main-content"
          className="absolute -top-10 left-2 z-[100] rounded-lg bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink shadow-md transition-[top] focus:top-2"
        >
          Skip to content
        </a>
        <Header onOpenSidebar={openSidebar} />
        <div className="hx-page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
