import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SpeakerTimer {
  elapsed: number
}

export interface Segment {
  name: string
  duration: number
  type: 'speaker' | 'idle'
}

interface TimerState {
  speakers: Record<string, SpeakerTimer>
  globalRunning: boolean
  globalElapsed: number
  currentSpeaker: string | null
  idleElapsed: number
  segments: Segment[]
  activeSegmentStart: number | null
  idleSegmentStart: number | null
  lastTickTime: number | null
  addSpeaker: (name: string) => void
  removeSpeaker: (name: string) => void
  startGlobal: () => void
  pauseGlobal: () => void
  resetAll: () => void
  setCurrentSpeaker: (name: string | null) => void
  tick: () => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      speakers: {},
      globalRunning: false,
      globalElapsed: 0,
      currentSpeaker: null,
      idleElapsed: 0,
      segments: [],
      activeSegmentStart: null,
      idleSegmentStart: null,
      lastTickTime: null,

      addSpeaker: (name) =>
        set((s) => ({
          speakers: { ...s.speakers, [name]: { elapsed: 0 } },
        })),

      removeSpeaker: (name) =>
        set((s) => {
          const { [name]: _, ...speakers } = s.speakers
          const segments = s.segments.filter((seg) => seg.name !== name)
          if (s.currentSpeaker === name) {
            return {
              speakers,
              segments,
              currentSpeaker: null,
              activeSegmentStart: null,
              idleSegmentStart: s.globalRunning ? s.globalElapsed : null,
            }
          }
          return { speakers, segments }
        }),

      startGlobal: () =>
        set((s) => {
          if (s.globalRunning) return s
          const updates: Partial<TimerState> = {
            globalRunning: true,
            lastTickTime: Date.now(),
          }
          if (s.currentSpeaker === null && s.idleSegmentStart === null) {
            updates.idleSegmentStart = s.globalElapsed
          }
          if (s.currentSpeaker !== null && s.activeSegmentStart === null) {
            updates.activeSegmentStart = s.globalElapsed
          }
          return updates
        }),

      pauseGlobal: () =>
        set((s) => {
          if (!s.globalRunning) return s
          const newSegments = [...s.segments]
          const updates: Partial<TimerState> = { globalRunning: false }
          if (s.currentSpeaker !== null && s.activeSegmentStart !== null) {
            const duration = s.globalElapsed - s.activeSegmentStart
            if (duration > 0) {
              newSegments.push({ name: s.currentSpeaker, duration, type: 'speaker' })
            }
            updates.activeSegmentStart = null
          } else if (s.currentSpeaker === null && s.idleSegmentStart !== null) {
            const duration = s.globalElapsed - s.idleSegmentStart
            if (duration > 0) {
              newSegments.push({ name: '__idle__', duration, type: 'idle' })
            }
            updates.idleSegmentStart = null
          }
          updates.segments = newSegments
          return updates
        }),

      resetAll: () =>
        set((s) => {
          const resetSpeakers: Record<string, SpeakerTimer> = {}
          for (const name of Object.keys(s.speakers)) {
            resetSpeakers[name] = { elapsed: 0 }
          }
          return {
            speakers: resetSpeakers,
            globalRunning: false,
            globalElapsed: 0,
            currentSpeaker: null,
            idleElapsed: 0,
            segments: [],
            activeSegmentStart: null,
            idleSegmentStart: null,
            lastTickTime: null,
          }
        }),

      setCurrentSpeaker: (name) =>
        set((s) => {
          const newSegments = [...s.segments]
          if (s.currentSpeaker !== null && s.activeSegmentStart !== null) {
            const duration = s.globalElapsed - s.activeSegmentStart
            if (duration > 0) {
              newSegments.push({ name: s.currentSpeaker, duration, type: 'speaker' })
            }
          } else if (s.currentSpeaker === null && s.idleSegmentStart !== null) {
            const duration = s.globalElapsed - s.idleSegmentStart
            if (duration > 0) {
              newSegments.push({ name: '__idle__', duration, type: 'idle' })
            }
          }
          return {
            segments: newSegments,
            currentSpeaker: name,
            activeSegmentStart: name !== null ? s.globalElapsed : null,
            idleSegmentStart: name === null ? s.globalElapsed : null,
          }
        }),

      tick: () =>
        set((s) => {
          const now = Date.now()
          if (s.lastTickTime === null) return { lastTickTime: now }
          if (!s.globalRunning) return { lastTickTime: now }
          const delta = (now - s.lastTickTime) / 1000
          const globalElapsed = s.globalElapsed + delta
          const updates: Partial<TimerState> = { globalElapsed, lastTickTime: now }
          if (s.currentSpeaker !== null && s.speakers[s.currentSpeaker]) {
            updates.speakers = {
              ...s.speakers,
              [s.currentSpeaker]: { elapsed: s.speakers[s.currentSpeaker].elapsed + delta },
            }
          } else {
            updates.idleElapsed = s.idleElapsed + delta
          }
          return updates
        }),
    }),
    {
      name: 'stagetime-timers',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.lastTickTime = null
      },
    }
  )
)
