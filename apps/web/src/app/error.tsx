'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '14px',
      fontFamily: 'var(--font-sans, system-ui)', padding: '32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: 'oklch(0.95 0.04 22)', color: 'oklch(0.50 0.20 22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', fontWeight: 700,
      }}>!</div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink, #1a1a1a)', margin: 0 }}>
        Something went wrong
      </p>
      <p style={{ fontSize: '13px', color: 'var(--mute, #888)', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
        An unexpected error occurred. Try refreshing the page or going back.
      </p>
      {error?.message && process.env.NODE_ENV === 'development' && (
        <pre style={{
          fontSize: '11px', color: 'oklch(0.55 0.20 22)', background: 'oklch(0.96 0.04 22 / 0.5)',
          padding: '10px 14px', borderRadius: '8px', margin: 0, maxWidth: '560px',
          whiteSpace: 'pre-wrap', textAlign: 'left',
          fontFamily: 'var(--font-mono, monospace)',
        }}>{error.message}{error.digest ? `\n\nDigest: ${error.digest}` : ''}</pre>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px', fontSize: '13px', fontWeight: 600,
            border: 0, borderRadius: '10px', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#fff', boxShadow: '0 4px 12px -4px var(--accent-glow)',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '8px 18px', fontSize: '13px', fontWeight: 600,
            border: 0, borderRadius: '10px', textDecoration: 'none',
            background: 'var(--surface-2)', color: 'var(--ink-soft)',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
