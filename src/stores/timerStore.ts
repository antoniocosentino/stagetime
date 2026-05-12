import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SpeakerTimer {
  elapsed: number
  running: boolean
}

interface TimerState {
  speakers: Record<string, SpeakerTimer>
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
          for (const [key, speaker] of Object.entries(s.speakers)) {
            updated[key] = { ...speaker, running: key === name }
          }
          return { speakers: updated }
        }),
      pauseSpeaker: (name) =>
        set((s) => ({
          speakers: { ...s.speakers, [name]: { ...s.speakers[name], running: false } },
        })),
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
