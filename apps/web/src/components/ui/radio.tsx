'use client';

import * as React from 'react';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { cn } from '@/lib/utils';

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof BaseRadioGroup>,
  React.ComponentProps<typeof BaseRadioGroup>
>(({ className, ...props }, ref) => (
  <BaseRadioGroup ref={ref} className={cn('flex flex-col gap-2', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

export const Radio = React.forwardRef<
  React.ComponentRef<typeof BaseRadio.Root>,
  React.ComponentProps<typeof BaseRadio.Root>
>(({ className, value, ...props }, ref) => (
  <BaseRadio.Root
    ref={ref}
    value={value}
    className={cn(
      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface transition-colors outline-none',
      'focus-visible:ring-2 focus-visible:ring-accent/30',
      'data-[checked]:border-accent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <BaseRadio.Indicator className="h-2 w-2 rounded-full bg-accent data-[unchecked]:hidden" />
  </BaseRadio.Root>
));
Radio.displayName = 'Radio';
