import { formatSeconds } from '../utils/time'
import type { RenderedSegment } from '../utils/segments'

interface Props {
  totalSeconds: number
  globalElapsed: number
  globalRunning: boolean
  segments: RenderedSegment[]
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

const IDLE_STRIPE =
  'repeating-linear-gradient(45deg, #d1d5db, #d1d5db 4px, #f9fafb 4px, #f9fafb 8px)'

export function GlobalTimer({
  totalSeconds,
  globalElapsed,
  globalRunning,
  segments,
  onStart,
  onPause,
  onReset,
}: Props) {
  const remaining = totalSeconds - globalElapsed
  const isOvertime = globalElapsed > totalSeconds
  const label = isOvertime
    ? `+${formatSeconds(globalElapsed - totalSeconds)} overtime`
    : `${formatSeconds(remaining)} remaining`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}>
          {label}
        </p>
        <div className="flex gap-2">
          <button
            onClick={globalRunning ? onPause : onStart}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {globalRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            data-testid="segment"
            className="h-full"
            style={{
              width: `${(seg.duration / Math.max(totalSeconds, globalElapsed)) * 100}%`,
              ...(seg.color
                ? { backgroundColor: seg.color }
                : { background: IDLE_STRIPE }),
            }}
          />
        ))}
      </div>
    </div>
  )
}
