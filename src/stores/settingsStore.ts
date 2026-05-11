import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  names: string[]
  timeLimitMinutes: number
  setNames: (names: string[]) => void
  addName: (name: string) => void
  removeName: (name: string) => void
  setTimeLimitMinutes: (minutes: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      names: ['test speaker'],
      timeLimitMinutes: 15,
      setNames: (names) => set({ names }),
      addName: (name) => set((s) => ({ names: [...s.names, name] })),
      removeName: (name) => set((s) => ({ names: s.names.filter((n) => n !== name) })),
      setTimeLimitMinutes: (timeLimitMinutes) => set({ timeLimitMinutes }),
    }),
    {
      name: 'stagetime-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
