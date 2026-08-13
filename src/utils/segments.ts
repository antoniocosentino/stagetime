import { COLORS } from '../constants/colors'
import type { Segment } from '../stores/timerStore'

export interface RenderedSegment {
  duration: number
  color?: string
}

export function buildColorMap(names: string[]): Record<string, string> {
  const colorMap: Record<string, string> = {}
  names.forEach((name, i) => {
    colorMap[name] = COLORS[i % COLORS.length]
  })
  return colorMap
}

export interface ActiveSegmentState {
  segments: Segment[]
  globalRunning: boolean
  globalElapsed: number
  currentSpeaker: string | null
  activeSegmentStart: number | null
  idleSegmentStart: number | null
}

export function buildRenderedSegments(
  state: ActiveSegmentState,
  colorMap: Record<string, string>
): RenderedSegment[] {
  const rendered: RenderedSegment[] = state.segments.map((seg) =>
    seg.type === 'idle'
      ? { duration: seg.duration }
      : { duration: seg.duration, color: colorMap[seg.name] ?? '#6b7280' }
  )

  if (state.globalRunning) {
    if (state.currentSpeaker !== null && state.activeSegmentStart !== null) {
      const duration = state.globalElapsed - state.activeSegmentStart
      if (duration > 0) {
        rendered.push({ duration, color: colorMap[state.currentSpeaker] ?? '#6b7280' })
      }
    } else if (state.currentSpeaker === null && state.idleSegmentStart !== null) {
      const duration = state.globalElapsed - state.idleSegmentStart
      if (duration > 0) {
        rendered.push({ duration })
      }
    }
  }

  return rendered
}
