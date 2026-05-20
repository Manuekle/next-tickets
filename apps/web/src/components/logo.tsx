interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export default function Logo({ size = 32, showText = false, textSize = '15px' }: LogoProps) {
  const radius = size <= 32 ? '10px' : '11px';
  const iconSize = Math.round(size * 0.53);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: radius,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
          boxShadow: '0 4px 10px -4px color-mix(in oklch, var(--accent) 50%, transparent)',
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Ticket with scalloped notches on both sides + perforation stub line */}
          <path d="M3.5 8h17C21.33 8 22 8.67 22 9.5v2a1.5 1.5 0 010 3v2c0 .83-.67 1.5-1.5 1.5h-17C2.67 18 2 17.33 2 16.5v-2a1.5 1.5 0 010-3v-2C2 8.67 2.67 8 3.5 8z" />
          <line x1="16" y1="8.5" x2="16" y2="17.5" strokeWidth="1.4" strokeDasharray="1.8 1.4" strokeOpacity="0.7" />
        </svg>
      </div>

      {showText && (
        <span style={{ fontSize: textSize, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          open<span style={{ color: 'var(--accent)' }}>-tickets</span>
        </span>
      )}
    </div>
  );
}
