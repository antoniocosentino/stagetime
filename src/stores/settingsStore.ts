import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  names: string[]
  timeLimitMinutes: number
  setNames: (names: string[]) => void
  addName: (name: string) => void
  removeName: (name: string) => void
  setTimeLimitMinutes: (minutes: number) => void
  shuffleNames: () => void
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
      shuffleNames: () =>
        set((s) => {
          const arr = [...s.names]
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
          }
          return { names: arr }
        }),
    }),
    {
      name: 'stagetime-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
