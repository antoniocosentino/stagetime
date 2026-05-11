import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  totalSeconds: number
  totalElapsed: number
}

export function GlobalTimer({ totalSeconds, totalElapsed }: Props) {
  const remaining = totalSeconds - totalElapsed
  const progress = totalSeconds > 0 ? totalElapsed / totalSeconds : 0
  const isOvertime = totalElapsed > totalSeconds
  const label = isOvertime
    ? `+${formatSeconds(totalElapsed - totalSeconds)} overtime`
    : `${formatSeconds(remaining)} remaining`

  return (
    <div className="flex flex-col gap-2">
      <p className={`text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}>
        {label}
      </p>
      <ProgressBar progress={progress} />
    </div>
  )
}
