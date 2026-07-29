interface Props {
  progress: number  // 0–1 normal, >1 overtime
  color?: string
  thick?: boolean
}

export function ProgressBar({ progress, color, thick = false }: Props) {
  const isOvertime = progress > 1
  const widthPct = Math.min(progress * 100, 150)
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${thick ? 'h-5' : 'h-2.5'}`}>
      <div
        data-testid="progress-fill"
        className={`h-full rounded-full transition-all ${color ? '' : isOvertime ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${widthPct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  )
}
