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
  const fillPct = Math.min(progress * 100, 100)

  return (
    <div
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect() } } : undefined}
      className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${
        isCurrentSpeaker ? 'ring-2 ring-blue-500' : ''
      } ${onSelect ? 'cursor-pointer' : ''} ${square ? 'aspect-square relative z-0 overflow-hidden' : ''}`}
    >
      {square && (
        <div
          data-testid="card-fill"
          className="absolute inset-y-0 left-0 -z-10 transition-all"
          style={{ width: `${fillPct}%`, backgroundColor: color }}
        />
      )}
      <div className="flex items-center gap-2">
        <span
          data-testid="color-dot"
          className={`inline-block rounded-full flex-shrink-0 ${square ? 'w-6 h-6 border-2 border-white' : 'w-3 h-3'}`}
          style={{ backgroundColor: color }}
        />
        <h2 className={`font-semibold text-gray-800 truncate ${square ? 'text-[2rem]' : ''}`}>{name}</h2>
      </div>
      <p
        data-testid="time-display"
        className={`font-mono ${isOvertime ? 'text-red-600' : 'text-gray-600'} ${square ? 'text-[2.625rem]' : 'text-sm'}`}
      >
        {formatSeconds(elapsed)} / {formatSeconds(allottedSeconds)}
      </p>
      {!square && <ProgressBar progress={progress} color={color} />}
    </div>
  )
}
