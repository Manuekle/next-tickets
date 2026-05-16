import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f5f7] p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-[#172B4D]">
          next<span className="text-[#0052CC]">tickets</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
