"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) setInternalValue(newValue)
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div
        data-slot="tabs"
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-0.5 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, value, ...props }: React.ComponentProps<"button"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs")

  const isActive = ctx.value === value

  return (
    <button
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:text-foreground",
        className
      )}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    />
  )
}

function TabsContent({ className, value, ...props }: React.ComponentProps<"div"> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs")

  if (ctx.value !== value) return null

  return (
    <div
      data-slot="tabs-content"
      data-state="active"
      className={cn("mt-2", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
