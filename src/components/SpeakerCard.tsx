import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  name: string
  elapsed: number
  isCurrentSpeaker: boolean
  allottedSeconds: number
  color: string
  square?: boolean
  onSelect?: () => void
}

const RING_RADIUS = 42
const RING_STROKE = 10
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function SpeakerCard({
  name,
  elapsed,
  isCurrentSpeaker,
  allottedSeconds,
  color,
  square = false,
  onSelect,
}: Props) {
  const progress = allottedSeconds > 0 ? elapsed / allottedSeconds : 0
  const isOvertime = allottedSeconds > 0 && elapsed > allottedSeconds
  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(progress, 1))

  return (
    <div
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect() } } : undefined}
      className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${
        isCurrentSpeaker ? 'ring-2 ring-blue-500' : ''
      } ${onSelect ? 'cursor-pointer' : ''} ${square ? 'aspect-square' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span
          data-testid="color-dot"
          className={`inline-block rounded-full flex-shrink-0 ${square ? 'w-6 h-6' : 'w-3 h-3'}`}
          style={{ backgroundColor: color }}
        />
        <h2 className={`font-semibold text-gray-800 truncate ${square ? 'text-[2rem]' : ''}`}>{name}</h2>
      </div>
      {square ? (
        <div className="flex-1 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={RING_STROKE} />
            <circle
              data-testid="ring-progress"
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              className="transition-all"
            />
          </svg>
          <div
            data-testid="time-display"
            className={`absolute inset-0 flex flex-col items-center justify-center font-mono leading-tight ${isOvertime ? 'text-red-600' : 'text-gray-700'}`}
          >
            <span className="text-3xl font-semibold">{formatSeconds(elapsed)}</span>
            <span className="text-lg">/ {formatSeconds(allottedSeconds)}</span>
          </div>
        </div>
      ) : (
        <>
          <p
            data-testid="time-display"
            className={`text-sm font-mono ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}
          >
            {formatSeconds(elapsed)} / {formatSeconds(allottedSeconds)}
          </p>
          <ProgressBar progress={progress} color={color} />
        </>
      )}
    </div>
  )
}
