import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  name: string
  elapsed: number
  running: boolean
  allottedSeconds: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function SpeakerCard({ name, elapsed, running, allottedSeconds, onStart, onPause, onReset }: Props) {
  const progress = allottedSeconds > 0 ? elapsed / allottedSeconds : 0
  const isOvertime = elapsed > allottedSeconds

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <h2 className="font-semibold text-gray-800 truncate">{name}</h2>
      <p
        data-testid="time-display"
        className={`text-sm font-mono ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}
      >
        {formatSeconds(elapsed)} / {formatSeconds(allottedSeconds)}
      </p>
      <ProgressBar progress={progress} />
      <div className="flex gap-2">
        <button
          onClick={running ? onPause : onStart}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={onReset}
          className="rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
