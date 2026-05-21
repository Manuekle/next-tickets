'use client';

import { useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <Card className="mx-auto my-6 flex max-w-[560px] flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-tint text-danger">
        <HugeiconsIcon icon={AlertCircleIcon} size={20} />
      </div>
      <div className="text-sm font-semibold text-ink">This page failed to load</div>
      <div className="text-[13px] text-mute">
        Try refreshing. If the issue persists, contact an admin.
      </div>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre className="m-0 max-w-full whitespace-pre-wrap rounded-md bg-danger-tint px-3 py-2 text-left font-mono text-[11px] text-danger">
          {error.message}
        </pre>
      )}
      <Button onClick={reset} size="sm" className="mt-1">
        Retry
      </Button>
    </Card>
  );
}
