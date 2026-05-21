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

export function BarChart({ data, showValues = true, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-mute">
        No data available
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 truncate text-right text-[11px] text-mute" title={item.label}>
            {item.label}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-surface-2">
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
              style={{
                width: `${Math.max((item.value / max) * 100, 2)}%`,
                backgroundColor: item.color ?? 'var(--accent)',
              }}
            />
          </div>
          {showValues && (
            <span className="w-8 shrink-0 text-right text-[11px] font-medium tabular-nums text-ink">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}
