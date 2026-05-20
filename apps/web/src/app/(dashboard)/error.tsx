'use client';

import { useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: '14px', padding: '40px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      boxShadow: 'var(--shadow-sm)', textAlign: 'center', maxWidth: '560px', margin: '24px auto',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'oklch(0.95 0.04 22)', color: 'oklch(0.50 0.20 22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <HugeiconsIcon icon={AlertCircleIcon} size={20} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>This page failed to load</div>
      <div style={{ fontSize: '12.5px', color: 'var(--mute)' }}>
        Try refreshing. If the issue persists, contact an admin.
      </div>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre style={{
          fontSize: '11px', color: 'oklch(0.55 0.20 22)', background: 'oklch(0.96 0.04 22 / 0.5)',
          padding: '8px 12px', borderRadius: '7px', margin: 0, maxWidth: '100%',
          whiteSpace: 'pre-wrap', textAlign: 'left',
          fontFamily: 'var(--font-mono, monospace)',
        }}>{error.message}</pre>
      )}
      <button
        onClick={reset}
        style={{
          padding: '7px 16px', fontSize: '12px', fontWeight: 600, border: 0, borderRadius: '8px',
          background: 'var(--accent)', color: '#fff', cursor: 'pointer', marginTop: '4px',
        }}
      >
        Retry
      </button>
    </div>
  );
}
