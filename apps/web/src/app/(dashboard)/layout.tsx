import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/layout/command-palette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '248px 1fr',
        minHeight: '100vh',
        minWidth: '1280px',
        position: 'relative',
        zIndex: 1,
        padding: '12px',
        gap: '12px',
      }}
    >
      <Sidebar />
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: 'var(--surface)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}
      >
        <Header />
        <div
          style={{
            flex: 1,
            padding: '28px 32px 40px',
            minWidth: 0,
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
