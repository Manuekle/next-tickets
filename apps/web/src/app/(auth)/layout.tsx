import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div role="main" className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            next<span className="text-primary">tickets</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Ticket management system
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
