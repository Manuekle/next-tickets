'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-surface-2 text-ink-soft',
        outline: 'border-border bg-transparent text-mute',
        solid: 'border-transparent bg-accent text-accent-fg',
        success: 'border-transparent bg-success-tint text-success',
        warning: 'border-transparent bg-warning-tint text-warning',
        danger: 'border-transparent bg-danger-tint text-danger',
        info: 'border-transparent bg-info-tint text-info',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
