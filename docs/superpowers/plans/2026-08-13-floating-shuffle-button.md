# Floating Shuffle Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating dice button next to the settings gear that triggers the shuffle animation and speaker-order shuffle directly from the main screen, without requiring the settings panel to be open.

**Architecture:** Extract the shuffle-animation timing (2-second delayed call to `onShuffle`, `shuffling` boolean) out of `SettingsPanel` into a shared `useShuffleAnimation` hook. `SettingsPanel` switches to consuming the hook (no behavior change). `App.tsx` uses the same hook to drive a new floating button and a fullscreen shuffle overlay that mirrors the one already inside `SettingsPanel`.

**Tech Stack:** React, TypeScript, Vitest + @testing-library/react, Tailwind CSS. Run tests with `npx vitest run <path>` (repo's `npm test` runs vitest in watch mode).

## Global Constraints

- Settings panel's existing shuffle behavior and animation timing (2000ms) must not change.
- The new floating button reuses the existing `Dice3D` component (`src/components/Dice3D.tsx`) — do not fork it.
- New floating button style must match the existing settings gear button's classes (`fixed bottom-6 ... w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 ... hover:shadow-xl transition-all`), positioned at `right-20` (gear stays at `right-6`).
- The floating dice button must be hidden while `settingsOpen` is `true`.

---

### Task 1: Extract `useShuffleAnimation` hook

**Files:**
- Create: `src/hooks/useShuffleAnimation.ts`
- Test: `src/hooks/useShuffleAnimation.test.ts`

**Interfaces:**
- Produces: `useShuffleAnimation(onShuffle: () => void): { shuffling: boolean; trigger: () => void }`
  - Calling `trigger()` sets `shuffling` to `true` immediately.
  - After 2000ms, calls `onShuffle()` once, then sets `shuffling` back to `false`.
  - Calling `trigger()` again while `shuffling` is `true` is a no-op (does not restart the timer or call `onShuffle` again).
  - Clears its pending timeout on unmount.

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useShuffleAnimation.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react'
import { useShuffleAnimation } from './useShuffleAnimation'

afterEach(() => vi.useRealTimers())

it('starts with shuffling false', () => {
  const { result } = renderHook(() => useShuffleAnimation(vi.fn()))
  expect(result.current.shuffling).toBe(false)
})

it('sets shuffling to true immediately on trigger', () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useShuffleAnimation(vi.fn()))
  act(() => {
    result.current.trigger()
  })
  expect(result.current.shuffling).toBe(true)
})

it('calls onShuffle only after 2 seconds, then resets shuffling', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  const { result } = renderHook(() => useShuffleAnimation(onShuffle))

  act(() => {
    result.current.trigger()
  })
  expect(onShuffle).not.toHaveBeenCalled()

  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(onShuffle).not.toHaveBeenCalled()
  expect(result.current.shuffling).toBe(true)

  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(onShuffle).toHaveBeenCalledTimes(1)
  expect(result.current.shuffling).toBe(false)
})

it('ignores additional trigger calls while already shuffling', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  const { result } = renderHook(() => useShuffleAnimation(onShuffle))

  act(() => {
    result.current.trigger()
    result.current.trigger()
    result.current.trigger()
  })

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(onShuffle).toHaveBeenCalledTimes(1)
})

it('clears the pending timeout on unmount', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  const { result, unmount } = renderHook(() => useShuffleAnimation(onShuffle))

  act(() => {
    result.current.trigger()
  })
  unmount()

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(onShuffle).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useShuffleAnimation.test.ts`
Expected: FAIL — `Cannot find module './useShuffleAnimation'`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useShuffleAnimation.ts`:

```ts
import { useEffect, useRef, useState } from 'react'

export function useShuffleAnimation(onShuffle: () => void) {
  const [shuffling, setShuffling] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function trigger() {
    if (shuffling) return
    setShuffling(true)
    timeoutRef.current = setTimeout(() => {
      onShuffle()
      setShuffling(false)
    }, 2000)
  }

  return { shuffling, trigger }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useShuffleAnimation.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useShuffleAnimation.ts src/hooks/useShuffleAnimation.test.ts
git commit -m "feat: extract useShuffleAnimation hook"
```

---

### Task 2: Wire `SettingsPanel` to use the shared hook

**Files:**
- Modify: `src/components/SettingsPanel.tsx:1,56-72` (imports, remove local shuffle state, use hook)
- Test: `src/components/SettingsPanel.test.tsx` (no changes expected — existing shuffle tests must keep passing unchanged, proving behavior is identical)

**Interfaces:**
- Consumes: `useShuffleAnimation(onShuffle: () => void): { shuffling: boolean; trigger: () => void }` from Task 1 (`src/hooks/useShuffleAnimation.ts`).

- [ ] **Step 1: Confirm current shuffle tests pass before refactor (baseline)**

Run: `npx vitest run src/components/SettingsPanel.test.tsx`
Expected: PASS (all existing tests, including the 5 shuffle-related tests at lines 79-162)

- [ ] **Step 2: Replace local shuffle state with the hook**

In `src/components/SettingsPanel.tsx`, add the import:

```ts
import { useShuffleAnimation } from '../hooks/useShuffleAnimation'
```

Replace this block (current lines 56-72):

```ts
  const [shuffling, setShuffling] = useState(false)
  const shuffleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current)
    }
  }, [])

  function handleShuffleClick() {
    if (shuffling) return
    setShuffling(true)
    shuffleTimeoutRef.current = setTimeout(() => {
      onShuffle()
      setShuffling(false)
    }, 2000)
  }
```

with:

```ts
  const { shuffling, trigger: handleShuffleClick } = useShuffleAnimation(onShuffle)
```

Everything below (the `<Dice3D>` overlay, the shuffle `<button>`, `disabled={shuffling}`, etc.) references `shuffling` and `handleShuffleClick` exactly as before, so no further edits are needed in the render body.

- [ ] **Step 3: Run tests to verify they still pass**

Run: `npx vitest run src/components/SettingsPanel.test.tsx`
Expected: PASS (all tests, unchanged from baseline)

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsPanel.tsx
git commit -m "refactor: use shared useShuffleAnimation hook in SettingsPanel"
```

---

### Task 3: Add the floating shuffle button and overlay to `App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useShuffleAnimation(onShuffle: () => void): { shuffling: boolean; trigger: () => void }` from Task 1. `Dice3D({ size, spinning }: { size: number; spinning?: boolean })` from `src/components/Dice3D.tsx` (already used elsewhere — `data-testid="dice-3d"`, spinning cube gets class `dice-cube` on its inner element per `src/components/Dice3D.tsx:40`). `shuffleNames: () => void` from `useSettingsStore` (already imported in `App.tsx`).

- [ ] **Step 1: Write the failing tests**

Add to `src/App.test.tsx` (after existing imports, add `fireEvent` to the import from `@testing-library/react`, and `Dice3D`'s testid is `dice-3d` per existing convention):

```ts
import { render, screen, fireEvent } from '@testing-library/react'
```

Append these tests at the end of the file:

```ts
it('renders a floating shuffle button next to the settings button', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /shuffle order/i })).toBeInTheDocument()
})

it('shows the fullscreen dice overlay and calls shuffleNames after clicking the floating shuffle button', () => {
  vi.useFakeTimers()
  render(<App />)
  const button = screen.getByRole('button', { name: /shuffle order/i })

  fireEvent.click(button)
  expect(button).toBeDisabled()
  expect(document.querySelector('.bg-black\\/40')?.className).toContain('backdrop-blur-md')

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(document.querySelector('.bg-black\\/40')).not.toBeInTheDocument()
  expect(button).not.toBeDisabled()
  vi.useRealTimers()
})

it('hides the floating shuffle button while settings is open', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
  const shuffleButtons = screen.getAllByRole('button', { name: /shuffle order/i })
  expect(shuffleButtons).toHaveLength(1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — no button with name `/shuffle order/i` found (first new test fails; later ones fail similarly or on missing overlay)

- [ ] **Step 3: Implement the floating button and overlay in `App.tsx`**

Edit `src/App.tsx`. Add imports:

```ts
import { Dice3D } from './components/Dice3D'
import { useShuffleAnimation } from './hooks/useShuffleAnimation'
```

Inside `App()`, after the existing `useSettingsStore()` destructure, add:

```ts
  const { shuffling, trigger: handleShuffle } = useShuffleAnimation(shuffleNames)
```

In the JSX, right after the existing settings `<button>` (which ends at `</button>` following the `⚙` glyph) and before `{squareModeEnabled && <SquareModeIndicator />}`, add:

```tsx
      {!settingsOpen && (
        <button
          aria-label="Shuffle order"
          onClick={handleShuffle}
          disabled={shuffling}
          className={`fixed bottom-6 right-20 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all ${
            shuffling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Dice3D size={28} spinning={shuffling} />
        </button>
      )}
      {shuffling && !settingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 pointer-events-none">
          <Dice3D size={140} />
        </div>
      )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (all tests, including the 3 new ones)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (no regressions across the whole project)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: add floating shuffle button next to settings gear"
```

---

## Self-Review Notes

- **Spec coverage:** hook extraction (spec's `useShuffleAnimation`) → Task 1; `SettingsPanel` wired to shared hook, behavior unchanged → Task 2; new floating button, positioning, overlay, hidden-while-settings-open → Task 3. All spec sections covered.
- **Placeholder scan:** none — every step has concrete code.
- **Type consistency:** `useShuffleAnimation(onShuffle: () => void): { shuffling: boolean; trigger: () => void }` is identical across Tasks 1-3. `Dice3D` props (`size`, `spinning?`) used consistently with the existing component signature.
