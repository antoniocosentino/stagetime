import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SpeakerTimer {
  elapsed: number
  running: boolean
}

export interface SpeakerSegment {
  name: string
  duration: number
}

interface TimerState {
  speakers: Record<string, SpeakerTimer>
  segments: SpeakerSegment[]
  activeSegmentStart: Record<string, number>
  addSpeaker: (name: string) => void
  removeSpeaker: (name: string) => void
  startSpeaker: (name: string) => void
  pauseSpeaker: (name: string) => void
  resetSpeaker: (name: string) => void
  tickRunning: (delta: number) => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      speakers: {},
      segments: [],
      activeSegmentStart: {},
      addSpeaker: (name) =>
        set((s) => ({
          speakers: { ...s.speakers, [name]: { elapsed: 0, running: false } },
        })),
      removeSpeaker: (name) =>
        set((s) => {
          const { [name]: _, ...rest } = s.speakers
          return { speakers: rest }
        }),
      startSpeaker: (name) =>
        set((s) => {
          const updated: Record<string, SpeakerTimer> = {}
          const newSegments = [...s.segments]
          const newActiveSegmentStart = { ...s.activeSegmentStart }
          for (const [key, speaker] of Object.entries(s.speakers)) {
            if (speaker.running && key !== name) {
              const start = s.activeSegmentStart[key]
              if (start !== undefined) {
                newSegments.push({ name: key, duration: speaker.elapsed - start })
                delete newActiveSegmentStart[key]
              }
            }
            updated[key] = { ...speaker, running: key === name }
          }
          if (!s.speakers[name]?.running) {
            newActiveSegmentStart[name] = s.speakers[name]?.elapsed ?? 0
          }
          return { speakers: updated, segments: newSegments, activeSegmentStart: newActiveSegmentStart }
        }),
      pauseSpeaker: (name) =>
        set((s) => {
          const start = s.activeSegmentStart[name]
          const newSegments =
            start !== undefined
              ? [...s.segments, { name, duration: s.speakers[name].elapsed - start }]
              : s.segments
          const { [name]: _, ...activeSegmentStart } = s.activeSegmentStart
          return {
            speakers: { ...s.speakers, [name]: { ...s.speakers[name], running: false } },
            segments: newSegments,
            activeSegmentStart,
          }
        }),
      resetSpeaker: (name) =>
        set((s) => ({
          speakers: { ...s.speakers, [name]: { elapsed: 0, running: false } },
        })),
      tickRunning: (delta) =>
        set((s) => {
          const updated: Record<string, SpeakerTimer> = {}
          let changed = false
          for (const [name, speaker] of Object.entries(s.speakers)) {
            if (speaker.running) {
              updated[name] = { ...speaker, elapsed: speaker.elapsed + delta }
              changed = true
            } else {
              updated[name] = speaker
            }
          }
          return changed ? { speakers: updated } : s
        }),
    }),
    {
      name: 'stagetime-timers',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
