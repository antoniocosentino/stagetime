# Speaker Colors + Segmented Global Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-speaker color identities and replace the single-fill global progress bar with a chronological segmented bar reflecting actual speaking order.

**Architecture:** Colors are computed at render time from a fixed 8-color palette by speaker index (no persistence). `timerStore` gains `segments` (chronological completed-run log) and `activeSegmentStart` (when each currently-running speaker's run began); these are updated on start/pause/reset/remove events. `MainView` builds a `ColoredSegment[]` array combining completed segments plus a live in-progress entry and passes it to `GlobalTimer`, which renders proportional colored divs.

**Tech Stack:** React 18, TypeScript, Zustand 5, Tailwind CSS v4, Vitest 2 + Testing Library

---

## File Map

| Action | File |
|---|---|
| Create | `src/constants/colors.ts` |
| Modify | `src/stores/timerStore.ts` |
| Modify | `src/stores/timerStore.test.ts` |
| Modify | `src/components/ProgressBar.tsx` |
| Modify | `src/components/ProgressBar.test.tsx` |
| Modify | `src/components/SpeakerCard.tsx` |
| Modify | `src/components/SpeakerCard.test.tsx` |
| Modify | `src/components/GlobalTimer.tsx` |
| Modify | `src/components/GlobalTimer.test.tsx` |
| Modify | `src/components/MainView.tsx` |

---

### Task 1: Add COLORS constant

**Files:**
- Create: `src/constants/colors.ts`

- [ ] **Step 1: Create the file**

```ts
export const COLORS = [
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#06b6d4',
  '#eab308',
  '#ec4899',
  '#14b8a6',
]
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/colors.ts
git commit -m "feat: add speaker color palette constant"
```

---

### Task 2: Extend timerStore types and state; implement pauseSpeaker segment finalization

**Files:**
- Modify: `src/stores/timerStore.ts`
- Modify: `src/stores/timerStore.test.ts`

- [ ] **Step 1: Add types and empty initial state to `timerStore.ts`**

Add `SpeakerSegment` export and extend the interface. Replace the full file content:

```ts
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
```

- [ ] **Step 2: Update `beforeEach` in `timerStore.test.ts` to reset new fields**

Replace the existing `beforeEach`:

```ts
beforeEach(() => {
  sessionStorage.clear()
  useTimerStore.setState({ speakers: {}, segments: [], activeSegmentStart: {} })
})
```

- [ ] **Step 3: Write failing test for `pauseSpeaker` segment finalization**

Add to `timerStore.test.ts` inside the `describe('timerStore')` block:

```ts
it('pauseSpeaker finalizes segment with correct duration', () => {
  useTimerStore.getState().addSpeaker('Alice')
  useTimerStore.getState().startSpeaker('Alice')
  useTimerStore.getState().tickRunning(5)
  useTimerStore.getState().pauseSpeaker('Alice')
  const { segments } = useTimerStore.getState()
  expect(segments).toHaveLength(1)
  expect(segments[0]).toEqual({ name: 'Alice', duration: 5 })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npx vitest run src/stores/timerStore.test.ts
```

Expected: FAIL — `expect(segments).toHaveLength(1)` receives 0.

- [ ] **Step 5: Implement `pauseSpeaker` with segment finalization in `timerStore.ts`**

Replace the `pauseSpeaker` action:

```ts
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
```

- [ ] **Step 6: Run all store tests to verify they pass**

```bash
npx vitest run src/stores/timerStore.test.ts
```

Expected: All tests PASS. (Note: the `startSpeaker` test that sets `activeSegmentStart` will be covered in Task 3 — existing mutual-exclusion tests still pass because `startSpeaker` behavior is unchanged here.)

- [ ] **Step 7: Commit**

```bash
git add src/stores/timerStore.ts src/stores/timerStore.test.ts
git commit -m "feat: extend timerStore with segments; pauseSpeaker finalizes segment"
```

---

### Task 3: Implement startSpeaker segment finalization

**Files:**
- Modify: `src/stores/timerStore.ts`
- Modify: `src/stores/timerStore.test.ts`

- [ ] **Step 1: Write failing tests for `startSpeaker` segment behavior**

Add to `timerStore.test.ts` inside the `describe('timerStore')` block:

```ts
it('startSpeaker finalizes the previously running speaker segment', () => {
  useTimerStore.getState().addSpeaker('Alice')
  useTimerStore.getState().addSpeaker('Bob')
  useTimerStore.getState().startSpeaker('Alice')
  useTimerStore.getState().tickRunning(3)
  useTimerStore.getState().startSpeaker('Bob')
  const { segments } = useTimerStore.getState()
  expect(segments).toHaveLength(1)
  expect(segments[0]).toEqual({ name: 'Alice', duration: 3 })
})

it('re-starting the same speaker does not push a zero-duration segment', () => {
  useTimerStore.getState().addSpeaker('Alice')
  useTimerStore.getState().startSpeaker('Alice')
  useTimerStore.getState().tickRunning(2)
  useTimerStore.getState().startSpeaker('Alice')
  const { segments } = useTimerStore.getState()
  expect(segments).toHaveLength(0)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/stores/timerStore.test.ts
```

Expected: FAIL — `expect(segments).toHaveLength(1)` receives 0 for the first test.

- [ ] **Step 3: Implement `startSpeaker` with segment finalization in `timerStore.ts`**

Replace the `startSpeaker` action:

```ts
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
```

- [ ] **Step 4: Run all store tests to verify they pass**

```bash
npx vitest run src/stores/timerStore.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/timerStore.ts src/stores/timerStore.test.ts
git commit -m "feat: startSpeaker finalizes prior speaker segment on mutual exclusion"
```

---

### Task 4: Implement resetSpeaker and removeSpeaker segment clearing

**Files:**
- Modify: `src/stores/timerStore.ts`
- Modify: `src/stores/timerStore.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `timerStore.test.ts` inside the `describe('timerStore')` block:

```ts
it('resetSpeaker removes only that speaker segments, leaving others intact', () => {
  useTimerStore.getState().addSpeaker('Alice')
  useTimerStore.getState().addSpeaker('Bob')
  useTimerStore.getState().startSpeaker('Alice')
  useTimerStore.getState().tickRunning(2)
  useTimerStore.getState().pauseSpeaker('Alice')
  useTimerStore.getState().startSpeaker('Bob')
  useTimerStore.getState().tickRunning(3)
  useTimerStore.getState().pauseSpeaker('Bob')
  useTimerStore.getState().resetSpeaker('Alice')
  const { segments } = useTimerStore.getState()
  expect(segments).toHaveLength(1)
  expect(segments[0]).toEqual({ name: 'Bob', duration: 3 })
})

it('removeSpeaker clears that speaker segments from history', () => {
  useTimerStore.getState().addSpeaker('Alice')
  useTimerStore.getState().startSpeaker('Alice')
  useTimerStore.getState().tickRunning(4)
  useTimerStore.getState().pauseSpeaker('Alice')
  useTimerStore.getState().removeSpeaker('Alice')
  expect(useTimerStore.getState().segments).toHaveLength(0)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/stores/timerStore.test.ts
```

Expected: FAIL — `expect(segments).toHaveLength(1)` receives 2 (both segments still present).

- [ ] **Step 3: Implement `resetSpeaker` and `removeSpeaker` with segment clearing in `timerStore.ts`**

Replace `resetSpeaker`:

```ts
resetSpeaker: (name) =>
  set((s) => {
    const { [name]: _, ...activeSegmentStart } = s.activeSegmentStart
    return {
      speakers: { ...s.speakers, [name]: { elapsed: 0, running: false } },
      segments: s.segments.filter((seg) => seg.name !== name),
      activeSegmentStart,
    }
  }),
```

Replace `removeSpeaker`:

```ts
removeSpeaker: (name) =>
  set((s) => {
    const { [name]: _speaker, ...speakers } = s.speakers
    const { [name]: _start, ...activeSegmentStart } = s.activeSegmentStart
    return {
      speakers,
      segments: s.segments.filter((seg) => seg.name !== name),
      activeSegmentStart,
    }
  }),
```

- [ ] **Step 4: Run all store tests to verify they pass**

```bash
npx vitest run src/stores/timerStore.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/timerStore.ts src/stores/timerStore.test.ts
git commit -m "feat: resetSpeaker and removeSpeaker clear segment history"
```

---

### Task 5: Add optional color prop to ProgressBar

**Files:**
- Modify: `src/components/ProgressBar.tsx`
- Modify: `src/components/ProgressBar.test.tsx`

- [ ] **Step 1: Write failing test**

Add to `ProgressBar.test.tsx`:

```ts
it('uses provided color as inline style when color prop is given', () => {
  const { container } = render(<ProgressBar progress={0.5} color="#3b82f6" />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.style.backgroundColor).toBe('rgb(59, 130, 246)')
  expect(fill.className).not.toContain('bg-green')
  expect(fill.className).not.toContain('bg-red')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/ProgressBar.test.tsx
```

Expected: FAIL — `expect(fill.style.backgroundColor).toBe(...)` receives empty string.

- [ ] **Step 3: Add `color` prop to `ProgressBar.tsx`**

Replace the full file:

```tsx
interface Props {
  progress: number
  color?: string
}

export function ProgressBar({ progress, color }: Props) {
  const isOvertime = progress > 1
  const widthPct = Math.min(progress * 100, 150)
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        data-testid="progress-fill"
        className={`h-full rounded-full transition-all ${color ? '' : isOvertime ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${widthPct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run all ProgressBar tests to verify they pass**

```bash
npx vitest run src/components/ProgressBar.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/ProgressBar.test.tsx
git commit -m "feat: add optional color prop to ProgressBar"
```

---

### Task 6: Add color dot to SpeakerCard

**Files:**
- Modify: `src/components/SpeakerCard.tsx`
- Modify: `src/components/SpeakerCard.test.tsx`

- [ ] **Step 1: Write failing test**

Add to `SpeakerCard.test.tsx`. Also update `baseProps` to include the new required `color` prop throughout the file:

```ts
const baseProps = {
  name: 'Alice',
  elapsed: 60,
  running: false,
  allottedSeconds: 300,
  color: '#3b82f6',
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
}
```

Add the new test:

```ts
it('renders color dot with correct background color', () => {
  const { container } = render(<SpeakerCard {...baseProps} color="#3b82f6" />)
  const dot = container.querySelector('[data-testid="color-dot"]') as HTMLElement
  expect(dot).toBeInTheDocument()
  expect(dot.style.backgroundColor).toBe('rgb(59, 130, 246)')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/SpeakerCard.test.tsx
```

Expected: FAIL — `expect(dot).toBeInTheDocument()` fails (element not found).

- [ ] **Step 3: Add `color` prop to `SpeakerCard.tsx`**

Replace the full file:

```tsx
import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  name: string
  elapsed: number
  running: boolean
  allottedSeconds: number
  color: string
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function SpeakerCard({ name, elapsed, running, allottedSeconds, color, onStart, onPause, onReset }: Props) {
  const progress = allottedSeconds > 0 ? elapsed / allottedSeconds : 0
  const isOvertime = elapsed > allottedSeconds

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
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

- [ ] **Step 4: Run all SpeakerCard tests to verify they pass**

```bash
npx vitest run src/components/SpeakerCard.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SpeakerCard.tsx src/components/SpeakerCard.test.tsx
git commit -m "feat: add color dot and colored progress bar to SpeakerCard"
```

---

### Task 7: Replace GlobalTimer single bar with segmented bar

**Files:**
- Modify: `src/components/GlobalTimer.tsx`
- Modify: `src/components/GlobalTimer.test.tsx`

- [ ] **Step 1: Export `ColoredSegment` type from `timerStore.ts`** (so GlobalTimer can import it)

Add to `src/stores/timerStore.ts` — after the `SpeakerSegment` interface:

```ts
export interface ColoredSegment {
  name: string
  duration: number
  color: string
}
```

- [ ] **Step 2: Write failing tests for segmented bar**

Update `GlobalTimer.test.tsx` — add `segments={[]}` to all existing render calls, and add the new tests:

```ts
import { render, screen } from '@testing-library/react'
import { GlobalTimer } from './GlobalTimer'

it('shows remaining time label when no time has elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={0} segments={[]} />)
  expect(screen.getByText('15:00 remaining')).toBeInTheDocument()
})

it('counts down correctly based on elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={60} segments={[]} />)
  expect(screen.getByText('14:00 remaining')).toBeInTheDocument()
})

it('shows overtime label when total elapsed exceeds total seconds', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={960} segments={[]} />)
  expect(screen.getByText('+1:00 overtime')).toBeInTheDocument()
})

it('renders one segment div per entry', () => {
  const segments = [
    { name: 'Alice', duration: 60, color: '#3b82f6' },
    { name: 'Bob', duration: 30, color: '#22c55e' },
  ]
  render(<GlobalTimer totalSeconds={900} totalElapsed={90} segments={segments} />)
  expect(screen.getAllByTestId('segment')).toHaveLength(2)
})

it('sets segment width proportional to totalSeconds', () => {
  const segments = [{ name: 'Alice', duration: 450, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer totalSeconds={900} totalElapsed={450} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.width).toBe('50%')
})

it('sets segment background color from segment color', () => {
  const segments = [{ name: 'Alice', duration: 60, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer totalSeconds={900} totalElapsed={60} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.backgroundColor).toBe('rgb(59, 130, 246)')
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/components/GlobalTimer.test.tsx
```

Expected: TypeScript error on missing `segments` prop, then test failures for segment-specific assertions.

- [ ] **Step 4: Rewrite `GlobalTimer.tsx` with segmented bar**

```tsx
import { formatSeconds } from '../utils/time'
import type { ColoredSegment } from '../stores/timerStore'

interface Props {
  totalSeconds: number
  totalElapsed: number
  segments: ColoredSegment[]
}

export function GlobalTimer({ totalSeconds, totalElapsed, segments }: Props) {
  const remaining = totalSeconds - totalElapsed
  const isOvertime = totalElapsed > totalSeconds
  const label = isOvertime
    ? `+${formatSeconds(totalElapsed - totalSeconds)} overtime`
    : `${formatSeconds(remaining)} remaining`

  return (
    <div className="flex flex-col gap-2">
      <p className={`text-sm font-medium ${isOvertime ? 'text-red-600' : 'text-gray-600'}`}>
        {label}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            data-testid="segment"
            className="h-full"
            style={{
              width: `${(seg.duration / totalSeconds) * 100}%`,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run all GlobalTimer tests to verify they pass**

```bash
npx vitest run src/components/GlobalTimer.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/stores/timerStore.ts src/components/GlobalTimer.tsx src/components/GlobalTimer.test.tsx
git commit -m "feat: replace GlobalTimer single bar with chronological segmented bar"
```

---

### Task 8: Wire MainView — compute colorMap and segments, pass to children

**Files:**
- Modify: `src/components/MainView.tsx`

No new tests for `MainView` (it's a wiring layer; children are tested in isolation).

- [ ] **Step 1: Update `MainView.tsx`**

Replace the full file:

```tsx
import { GlobalTimer } from './GlobalTimer'
import { SpeakerCard } from './SpeakerCard'
import { useSettingsStore } from '../stores/settingsStore'
import { useTimerStore } from '../stores/timerStore'
import { timePerSpeaker } from '../utils/time'
import { COLORS } from '../constants/colors'

export function MainView() {
  const { names, timeLimitMinutes } = useSettingsStore()
  const { speakers, segments, activeSegmentStart, startSpeaker, pauseSpeaker, resetSpeaker } =
    useTimerStore()

  const totalSeconds = timeLimitMinutes * 60
  const allotted = names.length > 0 ? timePerSpeaker(timeLimitMinutes, names.length) : totalSeconds
  const totalElapsed = Object.values(speakers).reduce((sum, s) => sum + s.elapsed, 0)

  const colorMap: Record<string, string> = {}
  names.forEach((name, i) => {
    colorMap[name] = COLORS[i % COLORS.length]
  })

  const runningSpeaker = Object.entries(speakers).find(([, s]) => s.running)
  const completedColored = segments.map((seg) => ({ ...seg, color: colorMap[seg.name] ?? '#6b7280' }))
  const coloredSegments = runningSpeaker
    ? [
        ...completedColored,
        {
          name: runningSpeaker[0],
          duration:
            runningSpeaker[1].elapsed -
            (activeSegmentStart[runningSpeaker[0]] ?? runningSpeaker[1].elapsed),
          color: colorMap[runningSpeaker[0]] ?? '#6b7280',
        },
      ]
    : completedColored

  return (
    <main className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
      <GlobalTimer
        totalSeconds={totalSeconds}
        totalElapsed={totalElapsed}
        segments={coloredSegments}
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
              running={speaker.running}
              allottedSeconds={allotted}
              color={colorMap[name]}
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

- [ ] **Step 2: Run the full test suite to verify no regressions**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/MainView.tsx
git commit -m "feat: wire MainView with speaker colors and segmented bar"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite one final time**

```bash
npx vitest run
```

Expected: All tests PASS, no errors or warnings.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.
