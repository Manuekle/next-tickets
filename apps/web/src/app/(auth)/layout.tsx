import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div role="main" className="flex min-h-screen items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="text-2xl font-heading font-medium tracking-tight">
            next<span className="text-[#36f4a4]">tickets</span>
          </Link>
          <p className="mt-2 text-sm text-muted-slate">
            Ticket management system
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
