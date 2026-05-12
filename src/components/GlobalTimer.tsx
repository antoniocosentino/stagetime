import { formatSeconds } from '../utils/time'
import type { ColoredSegment } from '../stores/timerStore'

interface Props {
  totalSeconds: number
  totalElapsed: number
  segments: ColoredSegment[]
}

export function GlobalTimer({ totalSeconds, totalElapsed, segments }: Props) {
  const remaining = totalSeconds - totalElapsed
  const isOvertime = totalElapsed > totalSeconds
  const label = isOvertime
    ? `+${formatSeconds(totalElapsed - totalSeconds)} overtime`
    : `${formatSeconds(remaining)} remaining`

  return (
    <div className="flex flex-col gap-2">
      <p className={`text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}>
        {label}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            data-testid="segment"
            className="h-full"
            style={{
              width: `${(seg.duration / Math.max(totalSeconds, totalElapsed)) * 100}%`,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </div>
    </div>
  )
}
