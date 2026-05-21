'use client';

import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export type CheckboxProps = React.ComponentProps<typeof BaseCheckbox.Root>;

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof BaseCheckbox.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <BaseCheckbox.Root
    ref={ref}
    className={cn(
      'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border border-border-strong bg-surface transition-colors outline-none',
      'focus-visible:ring-2 focus-visible:ring-accent/30',
      'data-[checked]:border-accent data-[checked]:bg-accent data-[checked]:text-accent-fg',
      'data-[indeterminate]:border-accent data-[indeterminate]:bg-accent data-[indeterminate]:text-accent-fg',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <BaseCheckbox.Indicator className="flex items-center justify-center text-current">
      <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={3} />
    </BaseCheckbox.Indicator>
  </BaseCheckbox.Root>
));
Checkbox.displayName = 'Checkbox';
