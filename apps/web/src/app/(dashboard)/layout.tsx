import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/layout/command-palette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main id="main-content" role="main" className="flex-1 p-6 pt-4">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
