'use client';

import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;
export const SelectGroupLabel = BaseSelect.GroupLabel;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Trigger>,
  React.ComponentProps<typeof BaseSelect.Trigger>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-[13px] text-ink',
      'transition-colors outline-none hover:bg-surface-2',
      'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20',
      'data-[popup-open]:border-accent disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
    <BaseSelect.Icon className="text-mute">
      <HugeiconsIcon icon={ArrowDown01Icon} size={13} />
    </BaseSelect.Icon>
  </BaseSelect.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={6} className="z-50 outline-none">
        <BaseSelect.Popup
          className={cn(
            'min-w-[var(--anchor-width)] max-h-[var(--available-height)] overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-pop',
            'origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof BaseSelect.Item>,
  React.ComponentProps<typeof BaseSelect.Item>
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Item
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-soft outline-none',
      'data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink',
      'data-[selected]:text-ink',
      className,
    )}
    {...props}
  >
    <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    <BaseSelect.ItemIndicator className="text-ink">
      <HugeiconsIcon icon={Tick02Icon} size={13} />
    </BaseSelect.ItemIndicator>
  </BaseSelect.Item>
));
SelectItem.displayName = 'SelectItem';
