import { cn } from '@/lib/utils';

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 6,
  className,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('animate-pulse bg-surface-2', className)}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-lg bg-surface p-2.5">
          <Skeleton width={24} height={24} radius={999} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton width="55%" height={12} />
            <Skeleton width="30%" height={10} />
          </div>
          <Skeleton width={60} height={18} radius={6} />
        </div>
      ))}
    </div>
  );
}
