import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-[420px] flex-col gap-3 px-6">
        <Skeleton height={28} width="40%" />
        <Skeleton height={16} width="70%" />
        <Skeleton height={16} width="55%" />
        <Skeleton height={120} radius={12} />
      </div>
    </div>
  );
}
