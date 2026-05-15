import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">System management and configuration</p>
      </div>
      <nav className="flex gap-4 border-b">
        <Link href="/admin" className="pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">Users</Link>
        <Link href="/admin/logs" className="pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">Audit Logs</Link>
        <Link href="/admin/settings" className="pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">Settings</Link>
      </nav>
      {children}
    </div>
  );
}
