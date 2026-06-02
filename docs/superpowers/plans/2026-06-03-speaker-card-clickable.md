# Speaker Card Clickable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "Currently speaking" button from SpeakerCard and make the whole card the click target, active only when the global timer is running.

**Architecture:** `onSelect` becomes optional on `SpeakerCard`; `MainView` passes it only when `globalRunning` is true. The card applies `cursor-pointer` and `onClick` only when `onSelect` is defined. No store changes needed.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, @testing-library/react

---

### Task 1: Update SpeakerCard tests and implementation

**Files:**
- Modify: `src/components/SpeakerCard.test.tsx`
- Modify: `src/components/SpeakerCard.tsx`

- [ ] **Step 1: Replace SpeakerCard tests**

Replace the full contents of `src/components/SpeakerCard.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerCard } from './SpeakerCard'

const baseProps = {
  name: 'Alice',
  elapsed: 60,
  isCurrentSpeaker: false,
  allottedSeconds: 300,
  color: '#3b82f6',
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

it('renders no button', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
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

it('card has cursor-pointer when onSelect is provided', () => {
  const { container } = render(<SpeakerCard {...baseProps} onSelect={vi.fn()} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).toContain('cursor-pointer')
})

it('card does not have cursor-pointer when onSelect is undefined', () => {
  const { container } = render(<SpeakerCard {...baseProps} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).not.toContain('cursor-pointer')
})

it('calls onSelect when card is clicked and onSelect is provided', async () => {
  const onSelect = vi.fn()
  const { container } = render(<SpeakerCard {...baseProps} onSelect={onSelect} />)
  await userEvent.click(container.querySelector('.rounded-xl')!)
  expect(onSelect).toHaveBeenCalledTimes(1)
})

it('does not throw when card is clicked and onSelect is undefined', async () => {
  const { container } = render(<SpeakerCard {...baseProps} />)
  await expect(
    userEvent.click(container.querySelector('.rounded-xl')!)
  ).resolves.not.toThrow()
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

- [ ] **Step 2: Run tests to confirm they fail for the right reasons**

```bash
npx vitest run src/components/SpeakerCard.test.tsx
```

Expected: several tests fail — "renders no button" fails because button still exists; cursor-pointer and card-click tests fail because implementation not updated yet.

- [ ] **Step 3: Update SpeakerCard implementation**

Replace the full contents of `src/components/SpeakerCard.tsx` with:

```tsx
import { formatSeconds } from '../utils/time'
import { ProgressBar } from './ProgressBar'

interface Props {
  name: string
  elapsed: number
  isCurrentSpeaker: boolean
  allottedSeconds: number
  color: string
  onSelect?: () => void
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
      onClick={onSelect}
      className={`bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm ${
        isCurrentSpeaker ? 'ring-2 ring-blue-500' : ''
      } ${onSelect ? 'cursor-pointer' : ''}`}
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
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm all pass**

```bash
npx vitest run src/components/SpeakerCard.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SpeakerCard.tsx src/components/SpeakerCard.test.tsx
git commit -m "feat: make SpeakerCard whole-card clickable, remove CTA button"
```

---

### Task 2: Update MainView to guard onSelect behind globalRunning

**Files:**
- Modify: `src/components/MainView.tsx`

- [ ] **Step 1: Update the onSelect prop passed to SpeakerCard**

In `src/components/MainView.tsx`, find the `<SpeakerCard ... onSelect={...} />` block (lines 72–85) and replace the `onSelect` prop:

From:
```tsx
onSelect={() =>
  currentSpeaker === name
    ? setCurrentSpeaker(null)
    : setCurrentSpeaker(name)
}
```

To:
```tsx
onSelect={
  globalRunning
    ? () => setCurrentSpeaker(currentSpeaker === name ? null : name)
    : undefined
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass with no failures.

- [ ] **Step 3: Commit**

```bash
git add src/components/MainView.tsx
git commit -m "feat: disable speaker card click when timer is not running"
```
