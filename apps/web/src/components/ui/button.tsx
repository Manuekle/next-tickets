import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-fg shadow-sm hover:bg-accent-hover',
        secondary:
          'bg-surface-2 text-ink hover:bg-surface-3',
        outline:
          'border border-border bg-surface text-ink shadow-sm hover:bg-surface-2',
        ghost:
          'text-ink-soft hover:bg-surface-2 hover:text-ink',
        destructive:
          'bg-danger text-white shadow-sm hover:opacity-90',
        link:
          'text-ink underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3.5 text-[13px]',
        lg: 'h-9 px-4 text-[13px]',
        pill: 'h-8 rounded-full px-4 text-[13px]',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
