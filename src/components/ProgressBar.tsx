interface Props {
  progress: number  // 0–1 normal, >1 overtime
}

export function ProgressBar({ progress }: Props) {
  const isOvertime = progress > 1
  const widthPct = Math.min(progress * 100, 150)
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        data-testid="progress-fill"
        className={`h-full rounded-full transition-all ${isOvertime ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${widthPct}%` }}
      />
    </div>
  )
}
