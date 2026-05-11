# Speaker Timer SPA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + TypeScript SPA where meeting participants each get an equal share of a configurable total time, with individual start/pause/reset controls, overtime tracking, and two-tier persistence.

**Architecture:** Two Zustand stores (settings→localStorage, timers→sessionStorage). A single `useInterval` tick at 100ms in `App` drives all timer updates. A `useEffect` in `App` reconciles the timer store whenever the settings names list changes.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, Zustand 5, Vitest, @testing-library/react

---

## File Map

```
src/
  main.tsx                        # React root mount (scaffold output, unchanged)
  App.tsx                         # Root: reconciliation useEffect + useInterval + layout
  App.test.tsx                    # Tests for reconciliation logic
  index.css                       # @import "tailwindcss"
  test/
    setup.ts                      # @testing-library/jest-dom import
  hooks/
    useInterval.ts                # setInterval wrapper hook
    useInterval.test.ts
  stores/
    settingsStore.ts              # names[], timeLimitMinutes — localStorage persist
    settingsStore.test.ts
    timerStore.ts                 # speakers Record<name, {elapsed, running}> — sessionStorage persist
    timerStore.test.ts
  utils/
    time.ts                       # formatSeconds(), timePerSpeaker()
    time.test.ts
  components/
    ProgressBar.tsx               # Reusable bar: green ≤100%, red >100%, capped at 150%
    ProgressBar.test.tsx
    SpeakerCard.tsx               # Card: name, time display, progress bar, start/pause/reset
    SpeakerCard.test.tsx
    GlobalTimer.tsx               # Full-width bar + remaining/overtime label
    GlobalTimer.test.tsx
    SettingsPanel.tsx             # Slide-in overlay: name list editor + time limit input
    SettingsPanel.test.tsx
    TopBar.tsx                    # App header: title + gear icon
    TopBar.test.tsx
    MainView.tsx                  # Layout: GlobalTimer + responsive SpeakerGrid
```

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/index.css`, `src/test/setup.ts`

- [ ] **Step 1: Run Vite scaffold**

```bash
npm create vite@latest . -- --template react-ts
```

If prompted about the existing directory, select **"Ignore files and continue"**.

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm install zustand
npm install -D tailwindcss @tailwindcss/vite vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Replace vite.config.ts with Tailwind v4 + Vitest config**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create src/test/setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Replace src/index.css with Tailwind import**

```css
@import "tailwindcss";
```

- [ ] **Step 6: Replace src/App.tsx with a minimal placeholder**

```tsx
export default function App() {
  return <div>stagetime</div>
}
```

- [ ] **Step 7: Delete scaffold boilerplate**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 8: Verify the dev server starts**

```bash
npm run dev
```

Expected: server starts on port 5173, browser shows "stagetime" with no errors.

- [ ] **Step 9: Verify the test runner works**

Create `src/test/smoke.test.ts`:
```ts
test('vitest is working', () => {
  expect(1 + 1).toBe(2)
})
```

Run:
```bash
npm test -- --run
```

Expected: 1 test passes.

- [ ] **Step 10: Delete the smoke test and commit**

```bash
rm src/test/smoke.test.ts
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind v4 + Vitest"
```

---

### Task 2: Time utility functions

**Files:**
- Create: `src/utils/time.ts`
- Create: `src/utils/time.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/time.test.ts`:
```ts
import { formatSeconds, timePerSpeaker } from './time'

describe('formatSeconds', () => {
  it('formats zero', () => {
    expect(formatSeconds(0)).toBe('0:00')
  })
  it('formats 65 seconds as 1:05', () => {
    expect(formatSeconds(65)).toBe('1:05')
  })
  it('formats 300 seconds as 5:00', () => {
    expect(formatSeconds(300)).toBe('5:00')
  })
  it('formats negative seconds (overtime -30s)', () => {
    expect(formatSeconds(-30)).toBe('-0:30')
  })
  it('formats negative minutes (overtime -90s)', () => {
    expect(formatSeconds(-90)).toBe('-1:30')
  })
})

describe('timePerSpeaker', () => {
  it('divides 15 minutes evenly among 3 speakers', () => {
    expect(timePerSpeaker(15, 3)).toBe(300)
  })
  it('returns full duration for a single speaker', () => {
    expect(timePerSpeaker(10, 1)).toBe(600)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/utils/time.test.ts
```

Expected: FAIL — "Cannot find module './time'"

- [ ] **Step 3: Implement src/utils/time.ts**

```ts
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
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/utils/time.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/time.ts src/utils/time.test.ts
git commit -m "feat: add time utility functions"
```

---

### Task 3: Settings store

**Files:**
- Create: `src/stores/settingsStore.ts`
- Create: `src/stores/settingsStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/stores/settingsStore.test.ts`:
```ts
import { useSettingsStore } from './settingsStore'

beforeEach(() => {
  localStorage.clear()
  useSettingsStore.setState({ names: ['test speaker'], timeLimitMinutes: 15 })
})

describe('settingsStore', () => {
  it('defaults to test speaker and 15 minutes', () => {
    const { names, timeLimitMinutes } = useSettingsStore.getState()
    expect(names).toEqual(['test speaker'])
    expect(timeLimitMinutes).toBe(15)
  })

  it('addName appends a name', () => {
    useSettingsStore.getState().addName('Alice')
    expect(useSettingsStore.getState().names).toEqual(['test speaker', 'Alice'])
  })

  it('removeName removes by value', () => {
    useSettingsStore.getState().addName('Alice')
    useSettingsStore.getState().removeName('test speaker')
    expect(useSettingsStore.getState().names).toEqual(['Alice'])
  })

  it('setNames replaces the full list', () => {
    useSettingsStore.getState().setNames(['Bob', 'Carol'])
    expect(useSettingsStore.getState().names).toEqual(['Bob', 'Carol'])
  })

  it('setTimeLimitMinutes updates the time limit', () => {
    useSettingsStore.getState().setTimeLimitMinutes(30)
    expect(useSettingsStore.getState().timeLimitMinutes).toBe(30)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/stores/settingsStore.test.ts
```

Expected: FAIL — "Cannot find module './settingsStore'"

- [ ] **Step 3: Implement src/stores/settingsStore.ts**

```ts
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
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/stores/settingsStore.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/settingsStore.ts src/stores/settingsStore.test.ts
git commit -m "feat: add settings store with localStorage persistence"
```

---

### Task 4: Timer store

**Files:**
- Create: `src/stores/timerStore.ts`
- Create: `src/stores/timerStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/stores/timerStore.test.ts`:
```ts
import { useTimerStore } from './timerStore'

beforeEach(() => {
  sessionStorage.clear()
  useTimerStore.setState({ speakers: {} })
})

describe('timerStore', () => {
  it('starts with no speakers', () => {
    expect(useTimerStore.getState().speakers).toEqual({})
  })

  it('addSpeaker creates entry with elapsed 0 and running false', () => {
    useTimerStore.getState().addSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toEqual({ elapsed: 0, running: false })
  })

  it('removeSpeaker deletes the entry', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().removeSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
  })

  it('startSpeaker sets running to true', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice'].running).toBe(true)
  })

  it('pauseSpeaker sets running to false', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().pauseSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice'].running).toBe(false)
  })

  it('resetSpeaker sets elapsed to 0 and running to false', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().tickRunning(5)
    useTimerStore.getState().resetSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toEqual({ elapsed: 0, running: false })
  })

  it('tickRunning increments elapsed only for running speakers', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().addSpeaker('Bob')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().tickRunning(0.1)
    const { speakers } = useTimerStore.getState()
    expect(speakers['Alice'].elapsed).toBeCloseTo(0.1)
    expect(speakers['Bob'].elapsed).toBe(0)
  })

  it('tickRunning does not update paused speakers', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().tickRunning(1)
    expect(useTimerStore.getState().speakers['Alice'].elapsed).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/stores/timerStore.test.ts
```

Expected: FAIL — "Cannot find module './timerStore'"

- [ ] **Step 3: Implement src/stores/timerStore.ts**

```ts
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
        set((s) => ({
          speakers: { ...s.speakers, [name]: { ...s.speakers[name], running: true } },
        })),
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
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/stores/timerStore.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/timerStore.ts src/stores/timerStore.test.ts
git commit -m "feat: add timer store with sessionStorage persistence"
```

---

### Task 5: useInterval hook

**Files:**
- Create: `src/hooks/useInterval.ts`
- Create: `src/hooks/useInterval.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useInterval.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react'
import { useInterval } from './useInterval'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('calls callback on each interval tick', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, 100))
  expect(callback).not.toHaveBeenCalled()
  act(() => { vi.advanceTimersByTime(300) })
  expect(callback).toHaveBeenCalledTimes(3)
})

it('does not call callback when delay is null', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, null))
  act(() => { vi.advanceTimersByTime(500) })
  expect(callback).not.toHaveBeenCalled()
})

it('always calls the latest callback reference without resetting the interval', () => {
  let count = 0
  const { rerender } = renderHook(
    ({ cb }: { cb: () => void }) => useInterval(cb, 100),
    { initialProps: { cb: () => { count++ } } }
  )
  act(() => { vi.advanceTimersByTime(100) })
  rerender({ cb: () => { count += 10 } })
  act(() => { vi.advanceTimersByTime(100) })
  expect(count).toBe(11)
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/hooks/useInterval.test.ts
```

Expected: FAIL — "Cannot find module './useInterval'"

- [ ] **Step 3: Implement src/hooks/useInterval.ts**

```ts
import { useEffect, useRef } from 'react'

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/hooks/useInterval.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useInterval.ts src/hooks/useInterval.test.ts
git commit -m "feat: add useInterval hook"
```

---

### Task 6: ProgressBar component

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/ProgressBar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/ProgressBar.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

it('renders the progress fill element', () => {
  const { container } = render(<ProgressBar progress={0.5} />)
  expect(container.querySelector('[data-testid="progress-fill"]')).toBeInTheDocument()
})

it('sets width to percentage of progress', () => {
  const { container } = render(<ProgressBar progress={0.75} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.style.width).toBe('75%')
})

it('caps width at 150% in overtime', () => {
  const { container } = render(<ProgressBar progress={2} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.style.width).toBe('150%')
})

it('applies green color when progress is within time (≤1)', () => {
  const { container } = render(<ProgressBar progress={0.5} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.className).toContain('bg-green')
})

it('applies red color when progress exceeds 1 (overtime)', () => {
  const { container } = render(<ProgressBar progress={1.1} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.className).toContain('bg-red')
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/components/ProgressBar.test.tsx
```

Expected: FAIL — "Cannot find module './ProgressBar'"

- [ ] **Step 3: Implement src/components/ProgressBar.tsx**

```tsx
interface Props {
  progress: number  // 0–1 normal, >1 overtime
}

export function ProgressBar({ progress }: Props) {
  const isOvertime = progress > 1
  const widthPct = Math.min(progress * 100, 150)
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        data-testid="progress-fill"
        className={`h-full rounded-full transition-all ${isOvertime ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${widthPct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/components/ProgressBar.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/ProgressBar.test.tsx
git commit -m "feat: add ProgressBar component with overtime coloring"
```

---

### Task 7: SpeakerCard component

**Files:**
- Create: `src/components/SpeakerCard.tsx`
- Create: `src/components/SpeakerCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/SpeakerCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerCard } from './SpeakerCard'

const baseProps = {
  name: 'Alice',
  elapsed: 60,
  running: false,
  allottedSeconds: 300,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
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

it('shows Start button when not running', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
})

it('shows Pause button when running', () => {
  render(<SpeakerCard {...baseProps} running={true} />)
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
})

it('calls onStart when Start is clicked', async () => {
  const onStart = vi.fn()
  render(<SpeakerCard {...baseProps} onStart={onStart} />)
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(onStart).toHaveBeenCalledTimes(1)
})

it('calls onPause when Pause is clicked', async () => {
  const onPause = vi.fn()
  render(<SpeakerCard {...baseProps} running={true} onPause={onPause} />)
  await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
  expect(onPause).toHaveBeenCalledTimes(1)
})

it('calls onReset when Reset is clicked', async () => {
  const onReset = vi.fn()
  render(<SpeakerCard {...baseProps} onReset={onReset} />)
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onReset).toHaveBeenCalledTimes(1)
})

it('shows time display in red when elapsed exceeds allotted', () => {
  const { container } = render(<SpeakerCard {...baseProps} elapsed={400} allottedSeconds={300} />)
  const display = container.querySelector('[data-testid="time-display"]') as HTMLElement
  expect(display.className).toContain('text-red')
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/components/SpeakerCard.test.tsx
```

Expected: FAIL — "Cannot find module './SpeakerCard'"

- [ ] **Step 3: Implement src/components/SpeakerCard.tsx**

```tsx
import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  name: string
  elapsed: number
  running: boolean
  allottedSeconds: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function SpeakerCard({ name, elapsed, running, allottedSeconds, onStart, onPause, onReset }: Props) {
  const progress = allottedSeconds > 0 ? elapsed / allottedSeconds : 0
  const isOvertime = elapsed > allottedSeconds

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <h2 className="font-semibold text-gray-800 truncate">{name}</h2>
      <p
        data-testid="time-display"
        className={`text-sm font-mono ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}
      >
        {formatSeconds(elapsed)} / {formatSeconds(allottedSeconds)}
      </p>
      <ProgressBar progress={progress} />
      <div className="flex gap-2">
        <button
          onClick={running ? onPause : onStart}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={onReset}
          className="rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/components/SpeakerCard.test.tsx
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SpeakerCard.tsx src/components/SpeakerCard.test.tsx
git commit -m "feat: add SpeakerCard component"
```

---

### Task 8: GlobalTimer component

**Files:**
- Create: `src/components/GlobalTimer.tsx`
- Create: `src/components/GlobalTimer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/GlobalTimer.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { GlobalTimer } from './GlobalTimer'

it('shows remaining time label when no time has elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={0} />)
  expect(screen.getByText('15:00 remaining')).toBeInTheDocument()
})

it('counts down correctly based on elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={60} />)
  expect(screen.getByText('14:00 remaining')).toBeInTheDocument()
})

it('shows overtime label when total elapsed exceeds total seconds', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={960} />)
  expect(screen.getByText('+1:00 overtime')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/components/GlobalTimer.test.tsx
```

Expected: FAIL — "Cannot find module './GlobalTimer'"

- [ ] **Step 3: Implement src/components/GlobalTimer.tsx**

```tsx
import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  totalSeconds: number
  totalElapsed: number
}

export function GlobalTimer({ totalSeconds, totalElapsed }: Props) {
  const remaining = totalSeconds - totalElapsed
  const progress = totalSeconds > 0 ? totalElapsed / totalSeconds : 0
  const isOvertime = totalElapsed > totalSeconds
  const label = isOvertime
    ? `+${formatSeconds(totalElapsed - totalSeconds)} overtime`
    : `${formatSeconds(remaining)} remaining`

  return (
    <div className="flex flex-col gap-2">
      <p className={`text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}>
        {label}
      </p>
      <ProgressBar progress={progress} />
    </div>
  )
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/components/GlobalTimer.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/GlobalTimer.tsx src/components/GlobalTimer.test.tsx
git commit -m "feat: add GlobalTimer component"
```

---

### Task 9: SettingsPanel component

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Create: `src/components/SettingsPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/SettingsPanel.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'

const baseProps = {
  names: ['Alice', 'Bob'],
  timeLimitMinutes: 15,
  onAddName: vi.fn(),
  onRemoveName: vi.fn(),
  onChangeName: vi.fn(),
  onSetTimeLimit: vi.fn(),
  onClose: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

it('renders all speaker name inputs', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
})

it('renders the time limit input', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByDisplayValue('15')).toBeInTheDocument()
})

it('calls onClose when the close button is clicked', async () => {
  const onClose = vi.fn()
  render(<SettingsPanel {...baseProps} onClose={onClose} />)
  await userEvent.click(screen.getByRole('button', { name: /close/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('calls onAddName when Add speaker is clicked', async () => {
  const onAddName = vi.fn()
  render(<SettingsPanel {...baseProps} onAddName={onAddName} />)
  await userEvent.click(screen.getByRole('button', { name: /add speaker/i }))
  expect(onAddName).toHaveBeenCalledTimes(1)
})

it('calls onRemoveName with the correct name when delete is clicked', async () => {
  const onRemoveName = vi.fn()
  render(<SettingsPanel {...baseProps} onRemoveName={onRemoveName} />)
  const deleteButtons = screen.getAllByRole('button', { name: /remove/i })
  await userEvent.click(deleteButtons[0])
  expect(onRemoveName).toHaveBeenCalledWith('Alice')
})

it('calls onChangeName with old and new name on blur', async () => {
  const onChangeName = vi.fn()
  render(<SettingsPanel {...baseProps} onChangeName={onChangeName} />)
  const input = screen.getByDisplayValue('Alice')
  await userEvent.clear(input)
  await userEvent.type(input, 'Carol')
  fireEvent.blur(input)
  expect(onChangeName).toHaveBeenLastCalledWith('Alice', 'Carol')
})

it('calls onSetTimeLimit with numeric value on change', async () => {
  const onSetTimeLimit = vi.fn()
  render(<SettingsPanel {...baseProps} onSetTimeLimit={onSetTimeLimit} />)
  const input = screen.getByDisplayValue('15')
  await userEvent.clear(input)
  await userEvent.type(input, '20')
  expect(onSetTimeLimit).toHaveBeenLastCalledWith(20)
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/components/SettingsPanel.test.tsx
```

Expected: FAIL — "Cannot find module './SettingsPanel'"

- [ ] **Step 3: Implement src/components/SettingsPanel.tsx**

```tsx
interface Props {
  names: string[]
  timeLimitMinutes: number
  onAddName: () => void
  onRemoveName: (name: string) => void
  onChangeName: (oldName: string, newName: string) => void
  onSetTimeLimit: (minutes: number) => void
  onClose: () => void
}

export function SettingsPanel({
  names,
  timeLimitMinutes,
  onAddName,
  onRemoveName,
  onChangeName,
  onSetTimeLimit,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Settings</h2>
          <button
            aria-label="Close"
            onClick={onClose}
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
              value={timeLimitMinutes}
              onChange={(e) => onSetTimeLimit(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Speakers</p>
            <div className="flex flex-col gap-2">
              {names.map((name) => (
                <div key={name} className="flex gap-2 items-center">
                  <input
                    type="text"
                    defaultValue={name}
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
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/components/SettingsPanel.test.tsx
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/SettingsPanel.test.tsx
git commit -m "feat: add SettingsPanel component"
```

---

### Task 10: TopBar component

**Files:**
- Create: `src/components/TopBar.tsx`
- Create: `src/components/TopBar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/TopBar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopBar } from './TopBar'

it('renders the app title', () => {
  render(<TopBar onOpenSettings={vi.fn()} />)
  expect(screen.getByText('stagetime')).toBeInTheDocument()
})

it('renders a settings button', () => {
  render(<TopBar onOpenSettings={vi.fn()} />)
  expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
})

it('calls onOpenSettings when the settings button is clicked', async () => {
  const onOpenSettings = vi.fn()
  render(<TopBar onOpenSettings={onOpenSettings} />)
  await userEvent.click(screen.getByRole('button', { name: /settings/i }))
  expect(onOpenSettings).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/components/TopBar.test.tsx
```

Expected: FAIL — "Cannot find module './TopBar'"

- [ ] **Step 3: Implement src/components/TopBar.tsx**

```tsx
interface Props {
  onOpenSettings: () => void
}

export function TopBar({ onOpenSettings }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <h1 className="font-bold text-gray-900 text-lg">stagetime</h1>
      <button
        aria-label="Open settings"
        onClick={onOpenSettings}
        className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100"
      >
        ⚙
      </button>
    </header>
  )
}
```

- [ ] **Step 4: Run to verify all pass**

```bash
npm test -- --run src/components/TopBar.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/TopBar.tsx src/components/TopBar.test.tsx
git commit -m "feat: add TopBar component"
```

---

### Task 11: MainView component

**Files:**
- Create: `src/components/MainView.tsx`

No unit tests needed — MainView is a pure layout composition of already-tested components. It will be covered by the App integration tests and browser smoke test.

- [ ] **Step 1: Implement src/components/MainView.tsx**

```tsx
import { GlobalTimer } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'

export function MainView() {
  const { names, timeLimitMinutes } = useSettingsStore()
  const { speakers, startSpeaker, pauseSpeaker, resetSpeaker } = useTimerStore()

  const totalSeconds = timeLimitMinutes * 60
  const allotted = names.length > 0 ? timePerSpeaker(timeLimitMinutes, names.length) : totalSeconds
  const totalElapsed = Object.values(speakers).reduce((sum, s) => sum + s.elapsed, 0)

  return (
    <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
      <GlobalTimer totalSeconds={totalSeconds} totalElapsed={totalElapsed} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {names.map((name) => {
          const speaker = speakers[name]
          if (!speaker) return null
          return (
            <SpeakerCard
              key={name}
              name={name}
              elapsed={speaker.elapsed}
              running={speaker.running}
              allottedSeconds={allotted}
              onStart={() => startSpeaker(name)}
              onPause={() => pauseSpeaker(name)}
              onReset={() => resetSpeaker(name)}
            />
          )
        })}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MainView.tsx
git commit -m "feat: add MainView layout component"
```

---

### Task 12: App component — wiring, reconciliation, and interval

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/App.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import { act } from 'react'
import App from './App'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useSettingsStore.setState({ names: ['Alice'], timeLimitMinutes: 15 })
  useTimerStore.setState({ speakers: {} })
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
  useTimerStore.setState({ speakers: { Alice: { elapsed: 10, running: false } } })
  render(<App />)
  act(() => {
    useSettingsStore.getState().removeName('Alice')
  })
  expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run src/App.test.tsx
```

Expected: FAIL — App still has the placeholder implementation.

- [ ] **Step 3: Implement src/App.tsx**

```tsx
import { useEffect, useState } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'
import { useInterval } from './hooks/useInterval'
import { TopBar } from './components/TopBar'
import { MainView } from './components/MainView'
import { SettingsPanel } from './components/SettingsPanel'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const names = useSettingsStore((s) => s.names)
  const { setNames, addName, removeName, setTimeLimitMinutes, timeLimitMinutes } = useSettingsStore()

  // Reconcile timer store entries with the current names list.
  // Reads timer state via getState() to avoid subscribing to every tick.
  useEffect(() => {
    const { speakers, addSpeaker, removeSpeaker } = useTimerStore.getState()
    names.forEach((name) => {
      if (!(name in speakers)) addSpeaker(name)
    })
    Object.keys(speakers).forEach((key) => {
      if (!names.includes(key)) removeSpeaker(key)
    })
  }, [names])

  // Single shared tick for all running timers.
  useInterval(() => {
    useTimerStore.getState().tickRunning(0.1)
  }, 100)

  function handleChangeName(oldName: string, newName: string) {
    setNames(names.map((n) => (n === oldName ? newName : n)))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <MainView />
      {settingsOpen && (
        <SettingsPanel
          names={names}
          timeLimitMinutes={timeLimitMinutes}
          onAddName={() => addName(`Speaker ${names.length + 1}`)}
          onRemoveName={removeName}
          onChangeName={handleChangeName}
          onSetTimeLimit={setTimeLimitMinutes}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run App tests to verify they pass**

```bash
npm test -- --run src/App.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
npm test -- --run
```

Expected: all tests pass (38 total across all files).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: wire App with store reconciliation and global tick interval"
```

---

### Task 13: Browser smoke test

No code changes — verify the full user flow in the browser.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the main view loads**

Open `http://localhost:5173`. Expected:
- Top bar with "stagetime" and a ⚙ icon
- "15:00 remaining" label and green progress bar
- One card for "test speaker" with Start and Reset buttons

- [ ] **Step 3: Verify timer ticking**

Click **Start** on the "test speaker" card. Expected:
- Elapsed time increases every 100ms
- Card progress bar fills left to right
- Global timer counts down in sync

- [ ] **Step 4: Verify pause and reset**

Click **Pause** — timer stops. Click **Reset** — elapsed returns to 0:00, progress bar empties.

- [ ] **Step 5: Verify overtime**

Start the timer and let it run past the allotted time. Expected:
- Card progress bar turns red and extends past full width
- Time display turns red
- Global timer switches to "+X:XX overtime" in red

- [ ] **Step 6: Verify settings**

Click ⚙. Expected:
- Settings panel slides in from the right
- "test speaker" visible in the name list
- Changing the time limit updates the global timer total immediately
- Adding a speaker creates a new card on the main view
- Removing a speaker removes its card
- Renaming a speaker updates the card (and resets that speaker's elapsed time)

- [ ] **Step 7: Verify persistence**

Reload the page (`Cmd+R` / `F5`). Expected:
- Settings (names, time limit) are preserved
- Timer elapsed values are preserved

Close the tab, open a new one at `http://localhost:5173`. Expected:
- Settings still preserved (localStorage)
- All elapsed times reset to 0:00 (sessionStorage cleared on tab close)

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: project complete and smoke-tested"
```
