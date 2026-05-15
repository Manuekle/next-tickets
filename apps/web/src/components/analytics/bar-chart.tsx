interface BarChartItem {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartItem[]
  height?: number
  showValues?: boolean
  maxValue?: number
}

export function BarChart({ data, height = 200, showValues = true, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-right text-xs text-muted-foreground truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 relative" style={{ height }}>
            <div
              className="absolute bottom-0 left-0 rounded-r transition-all duration-500"
              style={{
                height: `${Math.max((item.value / max) * 100, 1)}%`,
                width: '100%',
                maxWidth: '100%',
                backgroundColor: item.color ?? 'var(--color-primary)',
              }}
            />
          </div>
          {showValues && (
            <span className="w-12 shrink-0 text-xs font-medium tabular-nums">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}
