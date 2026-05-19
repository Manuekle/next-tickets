import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight:       '100dvh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      'var(--bg)',
      padding:         '24px 16px',
      position:        'relative',
      overflow:        'hidden',
    }}>
      {/* Mesh backdrop */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'radial-gradient(ellipse 80% 60% at 20% -10%, oklch(0.88 0.03 264 / 0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, oklch(0.90 0.03 258 / 0.18) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Link href="/about" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '11px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px -4px var(--accent-glow)',
            color: '#fff',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M2 10h4M18 10h4" />
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            open<span style={{ color: 'var(--accent-2)' }}>-tickets</span>
          </span>
        </Link>

        {children}

        <p style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'center' }}>
          Open-source · Self-hostable · MIT license
        </p>
      </div>
    </div>
  );
}
