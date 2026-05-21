'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: number;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name = 'User', src, size = 28, style, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36), ...style }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'bg-surface-3 text-ink-soft font-semibold tracking-tight overflow-hidden',
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </div>
  ),
);
Avatar.displayName = 'Avatar';
