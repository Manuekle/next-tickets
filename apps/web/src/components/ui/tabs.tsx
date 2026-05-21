'use client';

import * as React from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

export const Tabs = BaseTabs.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof BaseTabs.List>,
  React.ComponentProps<typeof BaseTabs.List>
>(({ className, ...props }, ref) => (
  <BaseTabs.List
    ref={ref}
    className={cn('relative flex items-center gap-1 border-b border-border', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTab = React.forwardRef<
  React.ComponentRef<typeof BaseTabs.Tab>,
  React.ComponentProps<typeof BaseTabs.Tab>
>(({ className, ...props }, ref) => (
  <BaseTabs.Tab
    ref={ref}
    className={cn(
      '-mb-px cursor-default border-b-2 border-transparent px-2.5 py-1.5 text-[13px] font-medium text-mute transition-colors outline-none',
      'hover:text-ink-soft data-[selected]:border-accent data-[selected]:text-ink',
      'focus-visible:ring-2 focus-visible:ring-accent/20',
      className,
    )}
    {...props}
  />
));
TabsTab.displayName = 'TabsTab';

export const TabsPanel = React.forwardRef<
  React.ComponentRef<typeof BaseTabs.Panel>,
  React.ComponentProps<typeof BaseTabs.Panel>
>(({ className, ...props }, ref) => (
  <BaseTabs.Panel ref={ref} className={cn('outline-none', className)} {...props} />
));
TabsPanel.displayName = 'TabsPanel';
