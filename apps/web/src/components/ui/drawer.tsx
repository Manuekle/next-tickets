'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

export const Drawer = BaseDialog.Root;
export const DrawerTrigger = BaseDialog.Trigger;
export const DrawerClose = BaseDialog.Close;
export const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof BaseDialog.Title>,
  React.ComponentProps<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title ref={ref} className={cn('text-base font-semibold text-ink', className)} {...props} />
));
DrawerTitle.displayName = 'DrawerTitle';

export const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof BaseDialog.Description>,
  React.ComponentProps<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description ref={ref} className={cn('text-[13px] text-mute', className)} {...props} />
));
DrawerDescription.displayName = 'DrawerDescription';

type Side = 'right' | 'left';

export function DrawerContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & { side?: Side }) {
  const isRight = side === 'right';
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
      <BaseDialog.Popup
        className={cn(
          'fixed top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-surface shadow-pop outline-none',
          isRight ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
          'transition-transform duration-200',
          isRight
            ? 'data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full'
            : 'data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
