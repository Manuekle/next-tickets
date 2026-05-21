interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export default function Logo({ size = 32, showText = false, textSize = '15px' }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <TicketMark size={size} />
      {showText && (
        <span
          className="font-bold lowercase tracking-tight text-ink"
          style={{ fontSize: textSize }}
        >
          tickets<span style={{ color: 'var(--brand-red)' }}>.</span>
        </span>
      )}
    </div>
  );
}

function TicketMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Fanned tickets behind, rotated around lower-left */}
      <g transform="rotate(-22 8 26)">
        <rect x="3" y="11" width="20" height="13" rx="3.2" fill="var(--brand-amber)" />
      </g>
      <g transform="rotate(-11 8 26)">
        <rect x="4" y="10" width="20" height="13" rx="3.2" fill="var(--brand-teal)" />
      </g>
      {/* Front red ticket with notch + perforation */}
      <g>
        <path
          d="M8 8h15a3 3 0 0 1 3 3v2.2a2 2 0 0 0 0 3.6V22a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-3.2a2 2 0 0 0 0-3.6V11a3 3 0 0 1 3-3Z"
          fill="var(--brand-red)"
        />
        <line
          x1="19" y1="9.5" x2="19" y2="23.5"
          stroke="#fff" strokeOpacity="0.85" strokeWidth="1.3"
          strokeLinecap="round" strokeDasharray="1.6 1.8"
        />
      </g>
    </svg>
  );
}
