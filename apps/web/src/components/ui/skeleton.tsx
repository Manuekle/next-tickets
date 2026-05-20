export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 50%, var(--surface-2) 100%)',
        backgroundSize: '200% 100%',
        animation: 'nt-skeleton 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonRow({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surface)', borderRadius: '10px' }}>
          <Skeleton width={24} height={24} radius={999} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="55%" height={12} />
            <Skeleton width="30%" height={10} />
          </div>
          <Skeleton width={60} height={18} radius={6} />
        </div>
      ))}
    </div>
  );
}
