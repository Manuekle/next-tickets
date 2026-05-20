import Link from 'next/link';
import Logo from '@/components/logo';

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
        <Link href="/about" style={{ textDecoration: 'none' }}>
          <Logo size={36} showText textSize="16px" />
        </Link>

        {children}

        <p style={{ fontSize: '11px', color: 'var(--mute)', textAlign: 'center' }}>
          Open-source · Self-hostable · MIT license
        </p>
      </div>
    </div>
  );
}
