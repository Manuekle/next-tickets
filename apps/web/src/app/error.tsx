'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '16px',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px',
        background: 'oklch(0.95 0.04 22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px',
      }}>⚠</div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink, #1a1a1a)', margin: 0 }}>
        Something went wrong
      </p>
      <p style={{ fontSize: '13px', color: 'var(--mute, #888)', margin: 0 }}>
        An unexpected error occurred. Try refreshing the page.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '8px 20px', fontSize: '13px', fontWeight: 600,
          border: 0, borderRadius: '10px', cursor: 'pointer',
          background: 'linear-gradient(135deg, oklch(0.52 0.26 275), oklch(0.60 0.25 305))',
          color: '#fff', boxShadow: '0 4px 12px -4px oklch(0.52 0.26 275 / 0.50)',
        }}
      >
        Try again
      </button>
    </div>
  );
}
