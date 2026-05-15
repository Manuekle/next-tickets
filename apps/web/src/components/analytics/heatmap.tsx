import { cn } from '@/lib/utils'

interface HeatmapCell {
  day: number
  hour: number
  count: number
}

interface HeatmapProps {
  data: HeatmapCell[]
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => String(i))

function getIntensityClass(count: number, max: number): string {
  if (max === 0) return 'bg-muted'
  const ratio = count / max
  if (ratio === 0) return 'bg-muted'
  if (ratio <= 0.25) return 'bg-primary/15'
  if (ratio <= 0.5) return 'bg-primary/35'
  if (ratio <= 0.75) return 'bg-primary/60'
  return 'bg-primary'
}

export function Heatmap({ data }: HeatmapProps) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const lookup = new Map(data.map((d) => [`${d.day}-${d.hour}`, d]))

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No heatmap data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className="flex items-center">
            <div className="w-10 shrink-0" />
            {HOUR_LABELS.map((h) => (
              <div
                key={h}
                className="w-6 shrink-0 text-center text-[10px] text-muted-foreground"
              >
                {h}
              </div>
            ))}
          </div>
          {DAY_LABELS.map((dayLabel, dayIndex) => (
            <div key={dayLabel} className="flex items-center">
              <div className="w-10 shrink-0 text-xs text-muted-foreground">
                {dayLabel}
              </div>
              {HOUR_LABELS.map((_, hourIndex) => {
                const cell = lookup.get(`${dayIndex}-${hourIndex}`)
                const count = cell?.count ?? 0
                return (
                  <div
                    key={hourIndex}
                    className={cn(
                      'w-6 h-6 rounded-sm border border-background transition-colors',
                      getIntensityClass(count, max)
                    )}
                    title={`${dayLabel} ${hourIndex}:00 - ${count} tickets`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-px">
          <div className="h-3 w-4 rounded-sm bg-muted" />
          <div className="h-3 w-4 rounded-sm bg-primary/15" />
          <div className="h-3 w-4 rounded-sm bg-primary/35" />
          <div className="h-3 w-4 rounded-sm bg-primary/60" />
          <div className="h-3 w-4 rounded-sm bg-primary" />
        </div>
        <span>High</span>
      </div>
    </div>
  )
}
