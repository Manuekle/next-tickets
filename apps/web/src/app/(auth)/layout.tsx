import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6 bg-default-100">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Link href="/" className="flex flex-col items-center gap-1">
          <span className="text-2xl font-semibold tracking-tight">
            next<span className="text-accent">tickets</span>
          </span>
          <span className="text-sm text-default-500">Ticket management system</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
