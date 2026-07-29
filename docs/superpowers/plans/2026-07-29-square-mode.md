# Square Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Square mode" setting that forces speaker cards into 1:1 squares and shows a live width×height indicator while the user manually resizes their browser window, to help them land on a square window shape themselves.

**Architecture:** A new persisted boolean (`squareModeEnabled`) in the existing Zustand `settingsStore`. `SettingsPanel` gets a toggle switch for it. `SpeakerCard` gets a `square` prop that conditionally applies Tailwind's `aspect-square` class, wired from `MainView` reading the store directly (as it already does for other settings). A new `SquareModeIndicator` component listens for `window`'s `resize` event and is conditionally mounted in `App.tsx` only while the setting is on.

**Tech Stack:** React 18, TypeScript, Zustand (with `persist` middleware), Tailwind CSS v4, Vitest + Testing Library.

## Global Constraints

- Match existing code style exactly: no semicolons, single quotes, function components, no comments unless explaining non-obvious behavior.
- The setting must persist via the existing `persist` middleware/localStorage, same as `timeLimitMinutes` / `idleTimeMinutes`.
- The resize indicator measures `window.outerWidth` / `window.outerHeight` (the OS window frame), not `innerWidth`/`innerHeight`.
- "Square" tolerance for the indicator's highlight color is `|width - height| <= 2` pixels.
- The indicator fades out 600ms after the last `resize` event, via a debounced timer stored in a ref (cleared and restarted on every event, never stacked).
- No new dependencies.

---

### Task 1: `squareModeEnabled` setting in the store

**Files:**
- Modify: `src/stores/settingsStore.ts`
- Test: `src/stores/settingsStore.test.ts`

**Interfaces:**
- Produces: `useSettingsStore` state field `squareModeEnabled: boolean` (default `false`) and action `setSquareModeEnabled(enabled: boolean): void`.

- [ ] **Step 1: Write the failing tests**

Add to `src/stores/settingsStore.test.ts`, inside the existing `beforeEach` reset the field too, and add two new `it` blocks inside the `describe('settingsStore', ...)` block:

```ts
beforeEach(() => {
  localStorage.clear()
  useSettingsStore.setState({ names: ['test speaker'], timeLimitMinutes: 15, idleTimeMinutes: 1, squareModeEnabled: false })
})
```

```ts
  it('defaults squareModeEnabled to false', () => {
    expect(useSettingsStore.getState().squareModeEnabled).toBe(false)
  })

  it('setSquareModeEnabled updates the flag', () => {
    useSettingsStore.getState().setSquareModeEnabled(true)
    expect(useSettingsStore.getState().squareModeEnabled).toBe(true)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/settingsStore.test.ts`
Expected: FAIL — `squareModeEnabled` is `undefined`, `setSquareModeEnabled` is not a function.

- [ ] **Step 3: Implement the store change**

In `src/stores/settingsStore.ts`, add to the `SettingsState` interface (after `idleTimeMinutes: number`):

```ts
  squareModeEnabled: boolean
```

and after `setIdleTimeMinutes: (minutes: number) => void`:

```ts
  setSquareModeEnabled: (enabled: boolean) => void
```

In the `create<SettingsState>()(persist((set) => ({ ... }` object, add after `idleTimeMinutes: 1,`:

```ts
      squareModeEnabled: false,
```

and after the `setIdleTimeMinutes` action:

```ts
      setSquareModeEnabled: (squareModeEnabled) => set({ squareModeEnabled }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/settingsStore.test.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Commit**

```bash
git add src/stores/settingsStore.ts src/stores/settingsStore.test.ts
git commit -m "feat: add squareModeEnabled setting to settingsStore"
```

---

### Task 2: Square mode toggle in the settings panel

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/SettingsPanel.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore` field `squareModeEnabled` and action `setSquareModeEnabled` from Task 1.
- Produces: `SettingsPanel` props `squareModeEnabled: boolean` and `onToggleSquareMode: () => void`. `App.tsx` now reads/writes `squareModeEnabled` — later tasks (3 and 4) will also read this same store field directly.

- [ ] **Step 1: Write the failing tests**

Add `squareModeEnabled: false` and `onToggleSquareMode: vi.fn()` to `baseProps` in `src/components/SettingsPanel.test.tsx`:

```ts
const baseProps = {
  names: ['Alice', 'Bob'],
  timeLimitMinutes: 15,
  idleTimeMinutes: 1,
  squareModeEnabled: false,
  onAddName: vi.fn(),
  onRemoveName: vi.fn(),
  onChangeName: vi.fn(),
  onSetTimeLimit: vi.fn(),
  onSetIdleTime: vi.fn(),
  onToggleSquareMode: vi.fn(),
  onShuffle: vi.fn(),
  onClose: vi.fn(),
}
```

Add these `it` blocks:

```ts
it('renders the square mode toggle in the off state', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByRole('switch', { name: /square mode/i })).toHaveAttribute('aria-checked', 'false')
})

it('renders the square mode toggle in the on state', () => {
  render(<SettingsPanel {...baseProps} squareModeEnabled={true} />)
  expect(screen.getByRole('switch', { name: /square mode/i })).toHaveAttribute('aria-checked', 'true')
})

it('calls onToggleSquareMode when the toggle is clicked', async () => {
  const onToggleSquareMode = vi.fn()
  render(<SettingsPanel {...baseProps} onToggleSquareMode={onToggleSquareMode} />)
  await userEvent.click(screen.getByRole('switch', { name: /square mode/i }))
  expect(onToggleSquareMode).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/SettingsPanel.test.tsx`
Expected: FAIL — no element with role `switch` and accessible name `/square mode/i` exists yet.

- [ ] **Step 3: Implement the toggle in `SettingsPanel.tsx`**

Add to the `Props` interface (after `idleTimeMinutes: number`):

```ts
  squareModeEnabled: boolean
```

and after `onSetIdleTime: (minutes: number) => void`:

```ts
  onToggleSquareMode: () => void
```

Add both new names to the destructured function parameters, then add this block as the first child inside `<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">`, right before the "Time limit" `<div>`:

```tsx
          <div className="flex items-center justify-between">
            <label htmlFor="square-mode-toggle" className="text-sm font-medium text-gray-700">
              Square mode
            </label>
            <button
              id="square-mode-toggle"
              type="button"
              role="switch"
              aria-checked={squareModeEnabled}
              onClick={onToggleSquareMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                squareModeEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  squareModeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
```

- [ ] **Step 4: Wire it up in `App.tsx`**

Add `squareModeEnabled` and `setSquareModeEnabled` to the destructured `useSettingsStore()` call in `App.tsx`, then pass the following two props to `<SettingsPanel ... />`:

```tsx
          squareModeEnabled={squareModeEnabled}
          onToggleSquareMode={() => setSquareModeEnabled(!squareModeEnabled)}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/SettingsPanel.test.tsx`
Expected: PASS, all tests in the file green.

- [ ] **Step 6: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/SettingsPanel.test.tsx src/App.tsx
git commit -m "feat: add square mode toggle to settings panel"
```

---

### Task 3: Square speaker cards

**Files:**
- Modify: `src/components/SpeakerCard.tsx`
- Modify: `src/components/MainView.tsx`
- Test: `src/components/SpeakerCard.test.tsx`

**Interfaces:**
- Consumes: `useSettingsStore` field `squareModeEnabled` from Task 1 (read directly in `MainView`, which already reads other settings fields the same way).
- Produces: `SpeakerCard` prop `square?: boolean` (default `false`).

- [ ] **Step 1: Write the failing tests**

Add to `src/components/SpeakerCard.test.tsx`:

```ts
it('applies aspect-square class when square is true', () => {
  const { container } = render(<SpeakerCard {...baseProps} square={true} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).toContain('aspect-square')
})

it('does not apply aspect-square class when square is false or omitted', () => {
  const { container } = render(<SpeakerCard {...baseProps} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).not.toContain('aspect-square')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/SpeakerCard.test.tsx`
Expected: FAIL — `aspect-square` never appears since the prop doesn't exist yet.

- [ ] **Step 3: Implement the prop in `SpeakerCard.tsx`**

Add to the `Props` interface (after `color: string`):

```ts
  square?: boolean
```

Add `square = false` to the destructured function parameters (after `color,`), then update the card's `className` template literal to include it:

```tsx
      className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${
        isCurrentSpeaker ? 'ring-2 ring-blue-500' : ''
      } ${onSelect ? 'cursor-pointer' : ''} ${square ? 'aspect-square' : ''}`}
```

- [ ] **Step 4: Wire it up in `MainView.tsx`**

Add `squareModeEnabled` to the destructured `useSettingsStore()` call at the top of `MainView`, then pass `square={squareModeEnabled}` to `<SpeakerCard ... />` in the `names.map` block.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/SpeakerCard.test.tsx`
Expected: PASS, all tests in the file green.

- [ ] **Step 6: Commit**

```bash
git add src/components/SpeakerCard.tsx src/components/MainView.tsx src/components/SpeakerCard.test.tsx
git commit -m "feat: force speaker cards into squares when square mode is on"
```

---

### Task 4: Resize indicator

**Files:**
- Create: `src/components/SquareModeIndicator.tsx`
- Create: `src/components/SquareModeIndicator.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: nothing (no props) — reads `window.outerWidth` / `window.outerHeight` directly.
- Produces: `SquareModeIndicator` component, mounted conditionally in `App.tsx` based on the `squareModeEnabled` store field already read in Task 2.

- [ ] **Step 1: Write the failing tests**

Create `src/components/SquareModeIndicator.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SquareModeIndicator } from './SquareModeIndicator'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setWindowSize(width: number, height: number) {
  window.outerWidth = width
  window.outerHeight = height
}

it('shows current outer width and height after a resize event', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator')).toHaveTextContent('900 × 500')
})

it('is visible immediately after a resize event', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-100')
})

it('applies green square styling when width and height are within 2px', () => {
  render(<SquareModeIndicator />)
  setWindowSize(800, 799)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator').className).toContain('text-green-400')
})

it('applies neutral styling when width and height differ by more than 2px', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator').className).toContain('text-white')
})

it('fades out 600ms after the last resize event', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(600)
  })
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-0')
})

it('does not fade out before 600ms have elapsed', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-100')
})

it('resets the hide timer on repeated resize events', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-100')
})

it('removes the resize listener on unmount without throwing', () => {
  const { unmount } = render(<SquareModeIndicator />)
  unmount()
  expect(() => fireEvent.resize(window)).not.toThrow()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/SquareModeIndicator.test.tsx`
Expected: FAIL — the module `./SquareModeIndicator` does not exist yet.

- [ ] **Step 3: Implement `SquareModeIndicator.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'

const HIDE_DELAY_MS = 600
const SQUARE_TOLERANCE_PX = 2

export function SquareModeIndicator() {
  const [size, setSize] = useState({ width: window.outerWidth, height: window.outerHeight })
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.outerWidth, height: window.outerHeight })
      setVisible(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const isSquare = Math.abs(size.width - size.height) <= SQUARE_TOLERANCE_PX

  return (
    <div
      data-testid="square-mode-indicator"
      className={`fixed bottom-6 left-6 z-50 pointer-events-none rounded-full bg-gray-900/80 px-3 py-1.5 font-mono text-sm shadow-lg transition-opacity duration-[250ms] ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${isSquare ? 'text-green-400' : 'text-white'}`}
    >
      {size.width} × {size.height}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/SquareModeIndicator.test.tsx`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Wire it up in `App.tsx`**

Import it: `import { SquareModeIndicator } from './components/SquareModeIndicator'`

Render it conditionally, alongside the existing gear button (`squareModeEnabled` is already destructured from `useSettingsStore()` from Task 2):

```tsx
      {squareModeEnabled && <SquareModeIndicator />}
```

Place this line right before the `{settingsOpen && (...)}` block in the returned JSX.

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS, every test file in the project green.

- [ ] **Step 7: Commit**

```bash
git add src/components/SquareModeIndicator.tsx src/components/SquareModeIndicator.test.tsx src/App.tsx
git commit -m "feat: show live window size indicator while resizing in square mode"
```

---

## Manual Verification (after Task 4)

- [ ] Run `npm run dev`, open the app, open Settings, toggle "Square mode" on.
- [ ] Confirm speaker cards become squares immediately.
- [ ] Drag the browser window's edge/corner to resize it; confirm the bottom-left indicator appears showing live width × height, turns green when width ≈ height, and fades out ~600ms after you stop dragging.
- [ ] Toggle "Square mode" off; confirm cards return to normal layout and the indicator no longer appears on resize.
- [ ] Reload the page with square mode on; confirm the setting persisted (cards still square, panel toggle still on).
