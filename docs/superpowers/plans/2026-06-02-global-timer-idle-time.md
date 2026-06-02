# Global Timer, Idle Time & Speaker Controls — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a global meeting timer with start/pause/reset controls, idle time tracking (with zebra progress bar), an idle time setting, updated per-speaker allocation formula, and a wall-clock-safe timer tick that fixes the tab-visibility bug.

**Architecture:** A single global timer (`globalRunning`, `globalElapsed`) replaces per-speaker `running` flags. A `currentSpeaker` field routes elapsed time to either a named speaker or the shared `idleElapsed` bucket. The `tick()` action computes delta from `Date.now() - lastTickTime` so background tabs catch up correctly on resume.

**Tech Stack:** React 18, Zustand 5 (persist middleware), Vitest + Testing Library, Tailwind CSS 4, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `src/utils/time.ts` | Add `idleTimeMinutes` param to `timePerSpeaker` |
| `src/utils/time.test.ts` | Update + add tests for new signature |
| `src/stores/settingsStore.ts` | Add `idleTimeMinutes` + `setIdleTimeMinutes` |
| `src/stores/settingsStore.test.ts` | Add `idleTimeMinutes` tests |
| `src/stores/timerStore.ts` | Full rewrite — new state model + actions |
| `src/stores/timerStore.test.ts` | Full rewrite — new tests |
| `src/components/SettingsPanel.tsx` | Add idle time input field |
| `src/components/SettingsPanel.test.tsx` | Add idle time field tests |
| `src/components/GlobalTimer.tsx` | Add start/pause/reset controls; idle zebra segments |
| `src/components/GlobalTimer.test.tsx` | Update prop names; add controls + idle segment tests |
| `src/components/SpeakerCard.tsx` | Replace Start/Pause/Reset with "Currently speaking" toggle |
| `src/components/SpeakerCard.test.tsx` | Full rewrite — new props + behaviour |
| `src/components/MainView.tsx` | Rewire to new store API and segment construction |
| `src/App.tsx` | Switch to `tick()`, update reconciliation + new settings props |
| `src/App.test.tsx` | Fix stale `SpeakerTimer` shape reference |

---

## Task 1: Update `timePerSpeaker` utility

**Files:**
- Modify: `src/utils/time.ts`
- Modify: `src/utils/time.test.ts`

- [ ] **Step 1: Update the failing tests**

Replace the `timePerSpeaker` describe block in `src/utils/time.test.ts`:

```typescript
describe('timePerSpeaker', () => {
  it('subtracts idle time before dividing among speakers', () => {
    expect(timePerSpeaker(16, 1, 5)).toBe(180)
  })
  it('divides full time when idle is 0', () => {
    expect(timePerSpeaker(15, 0, 3)).toBe(300)
  })
  it('returns full remaining duration for a single speaker', () => {
    expect(timePerSpeaker(10, 1, 1)).toBe(540)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --run src/utils/time.test.ts
```

Expected: 2 old `timePerSpeaker` tests pass (wrong sig), 3 new ones fail with "Expected 3 arguments but got 2".

- [ ] **Step 3: Implement new signature**

Replace `timePerSpeaker` in `src/utils/time.ts`:

```typescript
export function timePerSpeaker(
  timeLimitMinutes: number,
  idleTimeMinutes: number,
  speakerCount: number
): number {
  return ((timeLimitMinutes - idleTimeMinutes) * 60) / speakerCount
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --run src/utils/time.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/time.ts src/utils/time.test.ts
git commit -m "feat: add idleTimeMinutes param to timePerSpeaker"
```

---

## Task 2: Add `idleTimeMinutes` to settings store

**Files:**
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/stores/settingsStore.test.ts`

- [ ] **Step 1: Add failing test**

Add inside `describe('settingsStore', ...)` in `src/stores/settingsStore.test.ts`, and update `beforeEach` to include the new field:

```typescript
// Update beforeEach reset:
beforeEach(() => {
  localStorage.clear()
  useSettingsStore.setState({ names: ['test speaker'], timeLimitMinutes: 15, idleTimeMinutes: 1 })
})

// Add new tests:
it('defaults idleTimeMinutes to 1', () => {
  expect(useSettingsStore.getState().idleTimeMinutes).toBe(1)
})

it('setIdleTimeMinutes updates the idle time', () => {
  useSettingsStore.getState().setIdleTimeMinutes(2)
  expect(useSettingsStore.getState().idleTimeMinutes).toBe(2)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --run src/stores/settingsStore.test.ts
```

Expected: 2 new tests FAIL with "is not a function" / property undefined.

- [ ] **Step 3: Implement changes in `src/stores/settingsStore.ts`**

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  names: string[]
  timeLimitMinutes: number
  idleTimeMinutes: number
  setNames: (names: string[]) => void
  addName: (name: string) => void
  removeName: (name: string) => void
  setTimeLimitMinutes: (minutes: number) => void
  setIdleTimeMinutes: (minutes: number) => void
  shuffleNames: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      names: ['test speaker'],
      timeLimitMinutes: 15,
      idleTimeMinutes: 1,
      setNames: (names) => set({ names }),
      addName: (name) => set((s) => ({ names: [...s.names, name] })),
      removeName: (name) => set((s) => ({ names: s.names.filter((n) => n !== name) })),
      setTimeLimitMinutes: (timeLimitMinutes) => set({ timeLimitMinutes }),
      setIdleTimeMinutes: (idleTimeMinutes) => set({ idleTimeMinutes }),
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
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --run src/stores/settingsStore.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/settingsStore.ts src/stores/settingsStore.test.ts
git commit -m "feat: add idleTimeMinutes setting"
```

---

## Task 3: Refactor `timerStore`

**Files:**
- Modify: `src/stores/timerStore.ts`
- Modify: `src/stores/timerStore.test.ts`

- [ ] **Step 1: Replace test file with new tests**

Replace the entire contents of `src/stores/timerStore.test.ts`:

```typescript
import { useTimerStore } from './timerStore'

const RESET_STATE = {
  speakers: {},
  globalRunning: false,
  globalElapsed: 0,
  currentSpeaker: null as string | null,
  idleElapsed: 0,
  segments: [] as never[],
  activeSegmentStart: null as number | null,
  idleSegmentStart: null as number | null,
  lastTickTime: null as number | null,
}

beforeEach(() => {
  sessionStorage.clear()
  useTimerStore.setState(RESET_STATE)
})

describe('timerStore', () => {
  it('starts with no speakers and timer not running', () => {
    const s = useTimerStore.getState()
    expect(s.speakers).toEqual({})
    expect(s.globalRunning).toBe(false)
    expect(s.globalElapsed).toBe(0)
  })

  it('addSpeaker creates entry with elapsed 0', () => {
    useTimerStore.getState().addSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toEqual({ elapsed: 0 })
  })

  it('removeSpeaker deletes the entry and its committed segments', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      segments: [{ name: 'Alice', duration: 5, type: 'speaker' }],
    })
    useTimerStore.getState().removeSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
    expect(useTimerStore.getState().segments).toHaveLength(0)
  })

  it('removeSpeaker clears currentSpeaker and resets to idle when timer is running', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      currentSpeaker: 'Alice',
      globalRunning: true,
      globalElapsed: 5,
      activeSegmentStart: 0,
    })
    useTimerStore.getState().removeSpeaker('Alice')
    const s = useTimerStore.getState()
    expect(s.currentSpeaker).toBeNull()
    expect(s.activeSegmentStart).toBeNull()
    expect(s.idleSegmentStart).toBe(5)
  })

  it('startGlobal sets globalRunning to true', () => {
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().globalRunning).toBe(true)
  })

  it('startGlobal sets idleSegmentStart when no currentSpeaker', () => {
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().idleSegmentStart).toBe(0)
  })

  it('startGlobal sets activeSegmentStart when currentSpeaker is set', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({ currentSpeaker: 'Alice', globalElapsed: 10 })
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().activeSegmentStart).toBe(10)
  })

  it('startGlobal is a no-op when already running', () => {
    useTimerStore.setState({ globalRunning: true, globalElapsed: 5 })
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().globalElapsed).toBe(5)
  })

  it('pauseGlobal sets globalRunning to false and commits idle segment', () => {
    useTimerStore.setState({
      globalRunning: true,
      globalElapsed: 10,
      idleSegmentStart: 0,
      currentSpeaker: null,
    })
    useTimerStore.getState().pauseGlobal()
    const s = useTimerStore.getState()
    expect(s.globalRunning).toBe(false)
    expect(s.segments).toHaveLength(1)
    expect(s.segments[0]).toEqual({ name: '__idle__', duration: 10, type: 'idle' })
    expect(s.idleSegmentStart).toBeNull()
  })

  it('pauseGlobal commits speaker segment when currentSpeaker is set', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalRunning: true,
      globalElapsed: 8,
      currentSpeaker: 'Alice',
      activeSegmentStart: 5,
    })
    useTimerStore.getState().pauseGlobal()
    const s = useTimerStore.getState()
    expect(s.segments[0]).toEqual({ name: 'Alice', duration: 3, type: 'speaker' })
    expect(s.activeSegmentStart).toBeNull()
  })

  it('pauseGlobal is a no-op when already paused', () => {
    useTimerStore.setState({ globalRunning: false, segments: [] })
    useTimerStore.getState().pauseGlobal()
    expect(useTimerStore.getState().segments).toHaveLength(0)
  })

  it('resetAll zeroes everything and preserves speaker keys', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalElapsed: 100,
      idleElapsed: 20,
      globalRunning: true,
      currentSpeaker: 'Alice',
      segments: [{ name: 'Alice', duration: 10, type: 'speaker' }],
      speakers: { Alice: { elapsed: 10 } },
    })
    useTimerStore.getState().resetAll()
    const s = useTimerStore.getState()
    expect(s.globalElapsed).toBe(0)
    expect(s.idleElapsed).toBe(0)
    expect(s.globalRunning).toBe(false)
    expect(s.currentSpeaker).toBeNull()
    expect(s.segments).toHaveLength(0)
    expect(s.speakers['Alice']).toEqual({ elapsed: 0 })
  })

  it('setCurrentSpeaker commits idle segment and opens speaker segment', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({ globalElapsed: 10, idleSegmentStart: 0 })
    useTimerStore.getState().setCurrentSpeaker('Alice')
    const s = useTimerStore.getState()
    expect(s.segments).toHaveLength(1)
    expect(s.segments[0]).toEqual({ name: '__idle__', duration: 10, type: 'idle' })
    expect(s.currentSpeaker).toBe('Alice')
    expect(s.activeSegmentStart).toBe(10)
    expect(s.idleSegmentStart).toBeNull()
  })

  it('setCurrentSpeaker(null) commits speaker segment and opens idle segment', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      currentSpeaker: 'Alice',
      globalElapsed: 15,
      activeSegmentStart: 10,
    })
    useTimerStore.getState().setCurrentSpeaker(null)
    const s = useTimerStore.getState()
    expect(s.segments).toHaveLength(1)
    expect(s.segments[0]).toEqual({ name: 'Alice', duration: 5, type: 'speaker' })
    expect(s.currentSpeaker).toBeNull()
    expect(s.idleSegmentStart).toBe(15)
    expect(s.activeSegmentStart).toBeNull()
  })

  it('setCurrentSpeaker switching speakers commits previous and opens new', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().addSpeaker('Bob')
    useTimerStore.setState({
      currentSpeaker: 'Alice',
      globalElapsed: 8,
      activeSegmentStart: 5,
    })
    useTimerStore.getState().setCurrentSpeaker('Bob')
    const s = useTimerStore.getState()
    expect(s.segments[0]).toEqual({ name: 'Alice', duration: 3, type: 'speaker' })
    expect(s.currentSpeaker).toBe('Bob')
    expect(s.activeSegmentStart).toBe(8)
  })

  it('tick sets lastTickTime when it was null and does not advance elapsed', () => {
    useTimerStore.getState().tick()
    const s = useTimerStore.getState()
    expect(s.lastTickTime).not.toBeNull()
    expect(s.globalElapsed).toBe(0)
  })

  it('tick does not advance elapsed when globalRunning is false', () => {
    useTimerStore.setState({ lastTickTime: Date.now() - 1000, globalRunning: false })
    useTimerStore.getState().tick()
    expect(useTimerStore.getState().globalElapsed).toBe(0)
  })

  it('tick advances globalElapsed and idleElapsed when running with no speaker', () => {
    useTimerStore.setState({ globalRunning: true, lastTickTime: Date.now() - 500 })
    useTimerStore.getState().tick()
    const s = useTimerStore.getState()
    expect(s.globalElapsed).toBeCloseTo(0.5, 1)
    expect(s.idleElapsed).toBeCloseTo(0.5, 1)
  })

  it('tick advances speaker elapsed when currentSpeaker is set', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalRunning: true,
      currentSpeaker: 'Alice',
      lastTickTime: Date.now() - 200,
    })
    useTimerStore.getState().tick()
    const s = useTimerStore.getState()
    expect(s.globalElapsed).toBeCloseTo(0.2, 1)
    expect(s.speakers['Alice'].elapsed).toBeCloseTo(0.2, 1)
    expect(s.idleElapsed).toBe(0)
  })

  it('tick does not mutate idleElapsed when a speaker is active', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalRunning: true,
      currentSpeaker: 'Alice',
      idleElapsed: 5,
      lastTickTime: Date.now() - 100,
    })
    useTimerStore.getState().tick()
    expect(useTimerStore.getState().idleElapsed).toBeCloseTo(5, 1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --run src/stores/timerStore.test.ts
```

Expected: all new tests FAIL (old store shape, missing actions).

- [ ] **Step 3: Implement new `src/stores/timerStore.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --run src/stores/timerStore.test.ts
```

Expected: all 20 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/timerStore.ts src/stores/timerStore.test.ts
git commit -m "feat: refactor timerStore — global timer, idle time, wall-clock tick"
```

---

## Task 4: Add idle time field to `SettingsPanel`

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/SettingsPanel.test.tsx`

- [ ] **Step 1: Add failing tests**

Add to `src/components/SettingsPanel.test.tsx`:

```typescript
// Update baseProps to include the new props:
const baseProps = {
  names: ['Alice', 'Bob'],
  timeLimitMinutes: 15,
  idleTimeMinutes: 1,
  onAddName: vi.fn(),
  onRemoveName: vi.fn(),
  onChangeName: vi.fn(),
  onSetTimeLimit: vi.fn(),
  onSetIdleTime: vi.fn(),
  onShuffle: vi.fn(),
  onClose: vi.fn(),
}

// Add new tests:
it('renders the idle time input with current value', () => {
  render(<SettingsPanel {...baseProps} idleTimeMinutes={2} />)
  expect(screen.getByDisplayValue('2')).toBeInTheDocument()
})

it('calls onSetIdleTime with numeric value on change', async () => {
  const onSetIdleTime = vi.fn()
  render(<SettingsPanel {...baseProps} onSetIdleTime={onSetIdleTime} />)
  const inputs = screen.getAllByRole('spinbutton')
  const idleInput = inputs[1]
  await userEvent.clear(idleInput)
  await userEvent.type(idleInput, '3')
  expect(onSetIdleTime).toHaveBeenLastCalledWith(3)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --run src/components/SettingsPanel.test.tsx
```

Expected: 2 new tests FAIL (props missing, element not found).

- [ ] **Step 3: Implement changes in `src/components/SettingsPanel.tsx`**

Update the Props interface and component:

```typescript
import { useState, useEffect, useRef } from 'react'

interface Props {
  names: string[]
  timeLimitMinutes: number
  idleTimeMinutes: number
  onAddName: () => void
  onRemoveName: (name: string) => void
  onChangeName: (oldName: string, newName: string) => void
  onSetTimeLimit: (minutes: number) => void
  onSetIdleTime: (minutes: number) => void
  onShuffle: () => void
  onClose: () => void
}

export function SettingsPanel({
  names,
  timeLimitMinutes,
  idleTimeMinutes,
  onAddName,
  onRemoveName,
  onChangeName,
  onSetTimeLimit,
  onSetIdleTime,
  onShuffle,
  onClose,
}: Props) {
  const [timeValue, setTimeValue] = useState(String(timeLimitMinutes))
  useEffect(() => { setTimeValue(String(timeLimitMinutes)) }, [timeLimitMinutes])

  const [idleValue, setIdleValue] = useState(String(idleTimeMinutes))
  useEffect(() => { setIdleValue(String(idleTimeMinutes)) }, [idleTimeMinutes])

  const [closing, setClosing] = useState(false)
  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 250)
  }

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const prevLengthRef = useRef(names.length)
  useEffect(() => {
    if (names.length > prevLengthRef.current) {
      const last = inputRefs.current[names.length - 1]
      last?.focus()
      last?.select()
    }
    prevLengthRef.current = names.length
  }, [names.length])

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex justify-end z-50 ${closing ? 'animate-[fade-out_0.25s_ease-in_forwards]' : 'animate-[fade-in_0.2s_ease-out]'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white w-full max-w-sm h-full flex flex-col shadow-xl ${closing ? 'animate-[slide-out-right_0.25s_ease-in_forwards]' : 'animate-[slide-in-right_0.25s_ease-out]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Settings</h2>
          <button
            aria-label="Close"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time limit (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={timeValue}
              onChange={(e) => {
                setTimeValue(e.target.value)
                const num = Number(e.target.value)
                if (e.target.value !== '' && !isNaN(num)) onSetTimeLimit(num)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Predicted idle time (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={idleValue}
              onChange={(e) => {
                setIdleValue(e.target.value)
                const num = Number(e.target.value)
                if (e.target.value !== '' && !isNaN(num)) onSetIdleTime(num)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Speakers</p>
            <div className="flex flex-col gap-2">
              {names.map((name, idx) => (
                <div key={name} className="flex gap-2 items-center">
                  <input
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    defaultValue={name}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && idx === names.length - 1) onAddName()
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== name) onChangeName(name, e.target.value)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemoveName(name)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={onAddName}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add speaker
            </button>
            <button
              aria-label="Shuffle order"
              onClick={onShuffle}
              className="mt-2 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              🎲 Shuffle order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --run src/components/SettingsPanel.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/SettingsPanel.test.tsx
git commit -m "feat: add idle time field to settings panel"
```

---

## Task 5: Update `GlobalTimer` — controls and zebra idle segments

**Files:**
- Modify: `src/components/GlobalTimer.tsx`
- Modify: `src/components/GlobalTimer.test.tsx`

- [ ] **Step 1: Replace test file with new tests**

Replace the entire contents of `src/components/GlobalTimer.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalTimer } from './GlobalTimer'

const baseProps = {
  totalSeconds: 900,
  globalElapsed: 0,
  globalRunning: false,
  segments: [] as { duration: number; color?: string }[],
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

it('shows remaining time label when no time has elapsed', () => {
  render(<GlobalTimer {...baseProps} />)
  expect(screen.getByText('15:00 remaining')).toBeInTheDocument()
})

it('counts down correctly based on elapsed', () => {
  render(<GlobalTimer {...baseProps} globalElapsed={60} />)
  expect(screen.getByText('14:00 remaining')).toBeInTheDocument()
})

it('shows overtime label when globalElapsed exceeds totalSeconds', () => {
  render(<GlobalTimer {...baseProps} globalElapsed={960} />)
  expect(screen.getByText('+1:00 overtime')).toBeInTheDocument()
})

it('renders one segment div per entry', () => {
  const segments = [
    { duration: 60, color: '#3b82f6' },
    { duration: 30, color: '#22c55e' },
  ]
  render(<GlobalTimer {...baseProps} globalElapsed={90} segments={segments} />)
  expect(screen.getAllByTestId('segment')).toHaveLength(2)
})

it('sets segment width proportional to totalSeconds', () => {
  const segments = [{ duration: 450, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={450} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.width).toBe('50%')
})

it('sets segment backgroundColor from color prop for speaker segments', () => {
  const segments = [{ duration: 60, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={60} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.backgroundColor).toBe('rgb(59, 130, 246)')
})

it('uses repeating-linear-gradient for idle segments (no color)', () => {
  const segments = [{ duration: 60 }]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={60} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.background).toContain('repeating-linear-gradient')
  expect(seg.style.backgroundColor).toBe('')
})

it('normalizes segment widths proportionally when in overtime', () => {
  const segments = [
    { duration: 600, color: '#3b82f6' },
    { duration: 600, color: '#22c55e' },
  ]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={1200} segments={segments} />
  )
  const segs = container.querySelectorAll('[data-testid="segment"]') as NodeListOf<HTMLElement>
  expect(segs[0].style.width).toBe('50%')
  expect(segs[1].style.width).toBe('50%')
})

it('shows Start button when not running', () => {
  render(<GlobalTimer {...baseProps} globalRunning={false} />)
  expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
})

it('shows Pause button when running', () => {
  render(<GlobalTimer {...baseProps} globalRunning={true} />)
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
})

it('calls onStart when Start is clicked', async () => {
  const onStart = vi.fn()
  render(<GlobalTimer {...baseProps} onStart={onStart} />)
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(onStart).toHaveBeenCalledTimes(1)
})

it('calls onPause when Pause is clicked', async () => {
  const onPause = vi.fn()
  render(<GlobalTimer {...baseProps} globalRunning={true} onPause={onPause} />)
  await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
  expect(onPause).toHaveBeenCalledTimes(1)
})

it('calls onReset when Reset is clicked', async () => {
  const onReset = vi.fn()
  render(<GlobalTimer {...baseProps} onReset={onReset} />)
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onReset).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --run src/components/GlobalTimer.test.tsx
```

Expected: multiple tests FAIL (missing props, missing buttons).

- [ ] **Step 3: Implement new `src/components/GlobalTimer.tsx`**

```typescript
import { formatSeconds } from '../utils/time'

export interface RenderedSegment {
  duration: number
  color?: string
}

interface Props {
  totalSeconds: number
  globalElapsed: number
  globalRunning: boolean
  segments: RenderedSegment[]
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

const IDLE_STRIPE =
  'repeating-linear-gradient(45deg, #d1d5db, #d1d5db 4px, #f9fafb 4px, #f9fafb 8px)'

export function GlobalTimer({
  totalSeconds,
  globalElapsed,
  globalRunning,
  segments,
  onStart,
  onPause,
  onReset,
}: Props) {
  const remaining = totalSeconds - globalElapsed
  const isOvertime = globalElapsed > totalSeconds
  const label = isOvertime
    ? `+${formatSeconds(globalElapsed - totalSeconds)} overtime`
    : `${formatSeconds(remaining)} remaining`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}>
          {label}
        </p>
        <div className="flex gap-2">
          <button
            onClick={globalRunning ? onPause : onStart}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {globalRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onReset}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            data-testid="segment"
            className="h-full"
            style={{
              width: `${(seg.duration / Math.max(totalSeconds, globalElapsed)) * 100}%`,
              ...(seg.color
                ? { backgroundColor: seg.color }
                : { background: IDLE_STRIPE }),
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --run src/components/GlobalTimer.test.tsx
```

Expected: all 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/GlobalTimer.tsx src/components/GlobalTimer.test.tsx
git commit -m "feat: add start/pause/reset controls and idle zebra segments to GlobalTimer"
```

---

## Task 6: Replace `SpeakerCard` Start/Pause/Reset with "Currently speaking" toggle

**Files:**
- Modify: `src/components/SpeakerCard.tsx`
- Modify: `src/components/SpeakerCard.test.tsx`

- [ ] **Step 1: Replace test file with new tests**

Replace the entire contents of `src/components/SpeakerCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerCard } from './SpeakerCard'

const baseProps = {
  name: 'Alice',
  elapsed: 60,
  isCurrentSpeaker: false,
  allottedSeconds: 300,
  color: '#3b82f6',
  onSelect: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

it('renders the speaker name', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

it('shows elapsed / allotted time as formatted strings', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByText('1:00 / 5:00')).toBeInTheDocument()
})

it('renders a single "Currently speaking" button', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByRole('button', { name: 'Currently speaking' })).toBeInTheDocument()
})

it('button has outlined style when not current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={false} />)
  const btn = container.querySelector('button')!
  expect(btn.className).toContain('border-gray-300')
})

it('button has filled blue style when current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={true} />)
  const btn = container.querySelector('button')!
  expect(btn.className).toContain('bg-blue-600')
})

it('card has ring styling when current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={true} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).toContain('ring-2')
})

it('card has no ring styling when not current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={false} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).not.toContain('ring-2')
})

it('calls onSelect when button is clicked', async () => {
  const onSelect = vi.fn()
  render(<SpeakerCard {...baseProps} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: 'Currently speaking' }))
  expect(onSelect).toHaveBeenCalledTimes(1)
})

it('shows time display in red when elapsed exceeds allotted', () => {
  const { container } = render(<SpeakerCard {...baseProps} elapsed={400} allottedSeconds={300} />)
  const display = container.querySelector('[data-testid="time-display"]') as HTMLElement
  expect(display.className).toContain('text-red')
})

it('renders color dot with correct background color', () => {
  const { container } = render(<SpeakerCard {...baseProps} color="#3b82f6" />)
  const dot = container.querySelector('[data-testid="color-dot"]') as HTMLElement
  expect(dot.style.backgroundColor).toBe('rgb(59, 130, 246)')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --run src/components/SpeakerCard.test.tsx
```

Expected: majority of tests FAIL (old props, no "Currently speaking" button).

- [ ] **Step 3: Implement new `src/components/SpeakerCard.tsx`**

```typescript
import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  name: string
  elapsed: number
  isCurrentSpeaker: boolean
  allottedSeconds: number
  color: string
  onSelect: () => void
}

export function SpeakerCard({
  name,
  elapsed,
  isCurrentSpeaker,
  allottedSeconds,
  color,
  onSelect,
}: Props) {
  const progress = allottedSeconds > 0 ? elapsed / allottedSeconds : 0
  const isOvertime = elapsed > allottedSeconds

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${
        isCurrentSpeaker ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          data-testid="color-dot"
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <h2 className="font-semibold text-gray-800 truncate">{name}</h2>
      </div>
      <p
        data-testid="time-display"
        className={`text-sm font-mono ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}
      >
        {formatSeconds(elapsed)} / {formatSeconds(allottedSeconds)}
      </p>
      <ProgressBar progress={progress} color={color} />
      <button
        onClick={onSelect}
        className={`w-full rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isCurrentSpeaker
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Currently speaking
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --run src/components/SpeakerCard.test.tsx
```

Expected: all 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SpeakerCard.tsx src/components/SpeakerCard.test.tsx
git commit -m "feat: replace start/pause/reset with currently-speaking toggle in SpeakerCard"
```

---

## Task 7: Rewire `MainView`

**Files:**
- Modify: `src/components/MainView.tsx`

No new tests needed — `MainView` has no dedicated test file and is covered by the integration test in `App.test.tsx`.

- [ ] **Step 1: Replace `src/components/MainView.tsx`**

```typescript
import { GlobalTimer } from './GlobalTimer'
import type { RenderedSegment } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'
import { COLORS } from '../constants/colors'

export function MainView() {
  const { names, timeLimitMinutes, idleTimeMinutes } = useSettingsStore()
  const {
    speakers,
    segments,
    globalRunning,
    globalElapsed,
    currentSpeaker,
    activeSegmentStart,
    idleSegmentStart,
    startGlobal,
    pauseGlobal,
    resetAll,
    setCurrentSpeaker,
  } = useTimerStore()

  const totalSeconds = timeLimitMinutes * 60
  const allotted =
    names.length > 0
      ? timePerSpeaker(timeLimitMinutes, idleTimeMinutes, names.length)
      : totalSeconds

  const colorMap: Record<string, string> = {}
  names.forEach((name, i) => {
    colorMap[name] = COLORS[i % COLORS.length]
  })

  const renderedSegments: RenderedSegment[] = segments.map((seg) =>
    seg.type === 'idle'
      ? { duration: seg.duration }
      : { duration: seg.duration, color: colorMap[seg.name] ?? '#6b7280' }
  )

  if (globalRunning) {
    if (currentSpeaker !== null && activeSegmentStart !== null) {
      const duration = globalElapsed - activeSegmentStart
      if (duration > 0) {
        renderedSegments.push({ duration, color: colorMap[currentSpeaker] ?? '#6b7280' })
      }
    } else if (currentSpeaker === null && idleSegmentStart !== null) {
      const duration = globalElapsed - idleSegmentStart
      if (duration > 0) {
        renderedSegments.push({ duration })
      }
    }
  }

  return (
    <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
      <GlobalTimer
        totalSeconds={totalSeconds}
        globalElapsed={globalElapsed}
        globalRunning={globalRunning}
        segments={renderedSegments}
        onStart={startGlobal}
        onPause={pauseGlobal}
        onReset={resetAll}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {names.map((name) => {
          const speaker = speakers[name]
          if (!speaker) return null
          return (
            <SpeakerCard
              key={name}
              name={name}
              elapsed={speaker.elapsed}
              isCurrentSpeaker={currentSpeaker === name}
              allottedSeconds={allotted}
              color={colorMap[name]}
              onSelect={() =>
                currentSpeaker === name
                  ? setCurrentSpeaker(null)
                  : setCurrentSpeaker(name)
              }
            />
          )
        })}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run all tests to verify nothing broke**

```
npm test -- --run
```

Expected: all tests PASS (some may fail if App.tsx hasn't been updated yet — that's fine, fix in Task 8).

- [ ] **Step 3: Commit**

```bash
git add src/components/MainView.tsx
git commit -m "feat: rewire MainView to new timer store and segment API"
```

---

## Task 8: Update `App.tsx` — tick, reconciliation, new settings props

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Update `src/App.test.tsx`**

Replace entire file:

```typescript
import { render } from '@testing-library/react'
import { act } from 'react'
import App from './App'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useSettingsStore.setState({ names: ['Alice'], timeLimitMinutes: 15, idleTimeMinutes: 1 })
  useTimerStore.setState({
    speakers: {},
    globalRunning: false,
    globalElapsed: 0,
    currentSpeaker: null,
    idleElapsed: 0,
    segments: [],
    activeSegmentStart: null,
    idleSegmentStart: null,
    lastTickTime: null,
  })
})

it('creates a timer entry for each name on mount', () => {
  render(<App />)
  expect(useTimerStore.getState().speakers['Alice']).toBeDefined()
})

it('adds a timer entry when a new name is added to settings', () => {
  render(<App />)
  act(() => {
    useSettingsStore.getState().addName('Bob')
  })
  expect(useTimerStore.getState().speakers['Bob']).toBeDefined()
})

it('removes the timer entry when a name is removed from settings', () => {
  useTimerStore.setState({ speakers: { Alice: { elapsed: 10 } } })
  render(<App />)
  act(() => {
    useSettingsStore.getState().removeName('Alice')
  })
  expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
})
```

- [ ] **Step 2: Update `src/App.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'
import { useInterval } from './hooks/useInterval'
import { MainView } from './components/MainView'
import { SettingsPanel } from './components/SettingsPanel'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const names = useSettingsStore((s) => s.names)
  const {
    setNames,
    addName,
    removeName,
    setTimeLimitMinutes,
    setIdleTimeMinutes,
    timeLimitMinutes,
    idleTimeMinutes,
    shuffleNames,
  } = useSettingsStore()

  useEffect(() => {
    const { speakers, addSpeaker, removeSpeaker } = useTimerStore.getState()
    names.forEach((name) => {
      if (!(name in speakers)) addSpeaker(name)
    })
    Object.keys(speakers).forEach((key) => {
      if (!names.includes(key)) removeSpeaker(key)
    })
  }, [names])

  useInterval(() => {
    useTimerStore.getState().tick()
  }, 100)

  function handleChangeName(oldName: string, newName: string) {
    setNames(names.map((n) => (n === oldName ? newName : n)))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MainView />
      <button
        aria-label="Open settings"
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl transition-all"
      >
        ⚙
      </button>
      {settingsOpen && (
        <SettingsPanel
          names={names}
          timeLimitMinutes={timeLimitMinutes}
          idleTimeMinutes={idleTimeMinutes}
          onAddName={() => addName(`Speaker ${names.length + 1}`)}
          onRemoveName={removeName}
          onChangeName={handleChangeName}
          onSetTimeLimit={setTimeLimitMinutes}
          onSetIdleTime={setIdleTimeMinutes}
          onShuffle={shuffleNames}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```
npm test -- --run
```

Expected: all tests PASS.

- [ ] **Step 4: TypeScript check**

```
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: wire idle time setting and wall-clock tick in App"
```

---

## Final verification

- [ ] **Run full test suite one last time**

```
npm test -- --run
```

Expected: all tests PASS, zero failures.

- [ ] **Manual smoke test**

```
npm run dev
```

1. Open the app in a browser
2. Verify the GlobalTimer shows "Start" and "Reset" buttons
3. Click Start — timer begins counting idle (zebra stripe appears in progress bar)
4. Click a speaker's "Currently speaking" button — their color segment starts in the progress bar; their card gets a blue ring
5. Click another speaker — previous speaker's segment commits, new one begins
6. Click the active speaker again — returns to idle (zebra resumes)
7. Click Pause — timer freezes; segment is committed
8. Click Reset — everything zeroes
9. Open settings — verify "Predicted idle time" field appears below "Time limit"
10. Switch tabs and come back — verify the timer kept running (no freeze)
