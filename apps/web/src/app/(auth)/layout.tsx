import Link from 'next/link';
import Logo from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4 py-6">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-7">
        <Link href="/about" className="no-underline">
          <Logo size={36} showText textSize="16px" />
        </Link>

        {children}

        <p className="text-center text-[11px] text-mute">
          Open-source · Self-hostable · MIT license
        </p>
      </div>
    </div>
  );
}
