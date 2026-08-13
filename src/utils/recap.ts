import { formatSeconds } from './time'

export interface LegendEntry {
  name: string
  color: string
  seconds: number
}

export function formatRecapTimeText(usedSeconds: number, allottedSeconds: number): string {
  const base = `${formatSeconds(usedSeconds)}/${formatSeconds(allottedSeconds)}`
  if (usedSeconds <= allottedSeconds) return base
  return `${base} (+${formatSeconds(usedSeconds - allottedSeconds)} overtime)`
}

export function computeLegendLayout(
  entries: LegendEntry[],
  maxVisible: number
): { shown: LegendEntry[]; moreCount: number } {
  if (entries.length <= maxVisible) return { shown: entries, moreCount: 0 }
  const shown = entries.slice(0, maxVisible - 1)
  return { shown, moreCount: entries.length - shown.length }
}
