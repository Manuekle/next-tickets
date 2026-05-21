'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3.5 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-tint text-2xl font-bold text-danger">
        !
      </div>
      <p className="text-[15px] font-semibold text-ink">Something went wrong</p>
      <p className="max-w-[420px] text-[13px] leading-relaxed text-mute">
        An unexpected error occurred. Try refreshing the page or going back.
      </p>
      {error?.message && process.env.NODE_ENV === 'development' && (
        <pre className="m-0 max-w-[560px] whitespace-pre-wrap rounded-lg bg-danger-tint px-3.5 py-2.5 text-left font-mono text-[11px] text-danger">
          {error.message}{error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
      )}
      <div className="mt-1 flex gap-2">
        <Button onClick={reset} size="lg">
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
