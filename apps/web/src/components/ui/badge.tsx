'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-[1.4] whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'border-transparent bg-surface-2 text-ink-soft',
        outline: 'border-border bg-transparent text-mute',
        solid: 'border-transparent bg-accent text-accent-fg',
        success: 'border-transparent bg-success-tint text-success',
        warning: 'border-transparent bg-warning-tint text-warning',
        danger: 'border-transparent bg-danger-tint text-danger',
        info: 'border-transparent bg-info-tint text-info',
        purple: 'border-transparent bg-cat-purple-tint text-cat-purple',
        blue: 'border-transparent bg-cat-blue-tint text-cat-blue',
        green: 'border-transparent bg-cat-green-tint text-cat-green',
        amber: 'border-transparent bg-cat-amber-tint text-cat-amber',
        red: 'border-transparent bg-cat-red-tint text-cat-red',
        pink: 'border-transparent bg-cat-pink-tint text-cat-pink',
        teal: 'border-transparent bg-cat-teal-tint text-cat-teal',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const CATEGORY_CYCLE: BadgeVariant[] = ['purple', 'blue', 'green', 'amber', 'red', 'pink', 'teal'];

/** Deterministically map an arbitrary string (category/tag name) to a pastel variant. */
export function categoryVariant(key: string): BadgeVariant {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORY_CYCLE[h % CATEGORY_CYCLE.length];
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
