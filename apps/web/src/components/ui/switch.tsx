'use client';

import * as React from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

export type SwitchProps = React.ComponentProps<typeof BaseSwitch.Root>;

export const Switch = React.forwardRef<
  React.ComponentRef<typeof BaseSwitch.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <BaseSwitch.Root
    ref={ref}
    className={cn(
      'relative inline-flex h-[18px] w-[30px] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none',
      'bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent/30',
      'data-[checked]:bg-accent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <BaseSwitch.Thumb
      className={cn(
        'block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
        'translate-x-0.5 data-[checked]:translate-x-[13px] data-[checked]:bg-accent-fg',
      )}
    />
  </BaseSwitch.Root>
));
Switch.displayName = 'Switch';
