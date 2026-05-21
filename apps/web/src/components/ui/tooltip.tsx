'use client';

import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = BaseTooltip.Provider;
export const TooltipRoot = BaseTooltip.Root;
export const TooltipTrigger = BaseTooltip.Trigger;

export function TooltipContent({
  className,
  children,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof BaseTooltip.Popup> & { sideOffset?: number }) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner sideOffset={sideOffset} className="z-50">
        <BaseTooltip.Popup
          className={cn(
            'rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-bg shadow-md',
            'origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}

export function Tooltip({
  content,
  children,
  sideOffset,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  sideOffset?: number;
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger render={children as React.ReactElement} />
      <TooltipContent sideOffset={sideOffset}>{content}</TooltipContent>
    </TooltipRoot>
  );
}
