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
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(8,10,18,0.55)', backdropFilter: 'blur(3px)',
            animation: 'hx-fade 150ms ease-out',
          }}
        >
          <div
            style={{ width: '268px', height: '100%', animation: 'hx-slide-from-left 200ms cubic-bezier(0.2,0.8,0.2,1)' }}
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
          style={{
            position: 'absolute', top: '-40px', left: '8px', zIndex: 100,
            padding: '8px 14px', fontSize: '13px', fontWeight: 600,
            background: 'var(--surface)', color: 'var(--ink)', borderRadius: '8px',
            textDecoration: 'none', boxShadow: 'var(--shadow-md)',
            transition: 'top 100ms',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLAnchorElement).style.top = '8px'; }}
          onBlur={(e) => { (e.currentTarget as HTMLAnchorElement).style.top = '-40px'; }}
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
