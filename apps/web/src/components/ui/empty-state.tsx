import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconSvgElement;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-border bg-surface-2 text-mute">
        <HugeiconsIcon icon={icon} size={22} />
      </div>
      <div className="text-sm font-semibold text-ink">{title}</div>
      {description && (
        <div className="max-w-[320px] text-xs leading-relaxed text-mute">{description}</div>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
