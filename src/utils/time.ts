export function formatSeconds(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : ''
  const abs = Math.abs(Math.floor(totalSeconds))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${sign}${m}:${s.toString().padStart(2, '0')}`
}

export function timePerSpeaker(timeLimitMinutes: number, speakerCount: number): number {
  return (timeLimitMinutes * 60) / speakerCount
}
