'use client';

import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { cn } from '@/lib/utils';

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;
export const DropdownMenuGroup = BaseMenu.Group;

export const DropdownMenuGroupLabel = React.forwardRef<
  React.ComponentRef<typeof BaseMenu.GroupLabel>,
  React.ComponentProps<typeof BaseMenu.GroupLabel>
>(({ className, ...props }, ref) => (
  <BaseMenu.GroupLabel
    ref={ref}
    className={cn('px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-mute', className)}
    {...props}
  />
));
DropdownMenuGroupLabel.displayName = 'DropdownMenuGroupLabel';

export const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof BaseMenu.Separator>,
  React.ComponentProps<typeof BaseMenu.Separator>
>(({ className, ...props }, ref) => (
  <BaseMenu.Separator ref={ref} className={cn('my-1 h-px bg-border', className)} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export function DropdownMenuContent({
  className,
  children,
  align = 'start',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof BaseMenu.Popup> & {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner align={align} sideOffset={sideOffset} className="z-50 outline-none">
        <BaseMenu.Popup
          className={cn(
            'min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-pop outline-none',
            'origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof BaseMenu.Item>,
  React.ComponentProps<typeof BaseMenu.Item> & { destructive?: boolean }
>(({ className, destructive, ...props }, ref) => (
  <BaseMenu.Item
    ref={ref}
    className={cn(
      'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none',
      'data-[highlighted]:bg-surface-2',
      destructive
        ? 'text-danger data-[highlighted]:bg-danger-tint data-[highlighted]:text-danger'
        : 'text-ink-soft data-[highlighted]:text-ink',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';
