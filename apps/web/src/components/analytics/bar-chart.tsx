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
      <div className="flex h-40 items-center justify-center text-sm text-mute">
        No data available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-right text-xs text-mute" title={item.label}>
            {item.label}
          </span>
          <div className="relative flex-1" style={{ height }}>
            <div
              className="absolute bottom-0 left-0 w-full max-w-full rounded-r transition-all duration-500"
              style={{
                height: `${Math.max((item.value / max) * 100, 1)}%`,
                backgroundColor: item.color ?? 'var(--accent)',
              }}
            />
          </div>
          {showValues && (
            <span className="w-12 shrink-0 text-xs font-medium tabular-nums text-ink">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}
