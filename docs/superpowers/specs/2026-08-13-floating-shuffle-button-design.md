# Floating Shuffle Button

**Date:** 2026-08-13
**Status:** Approved

## Overview

Shuffling speaker order happens far more often than editing settings, so it shouldn't require opening the settings panel. Add a second floating circle button next to the settings gear (bottom-right) that triggers the shuffle animation and shuffle directly from the main screen. The existing "Shuffle order" control inside `SettingsPanel` is unchanged in behavior and stays in place.

## Changes

### `useShuffleAnimation` hook (new: `src/hooks/useShuffleAnimation.ts`)

Extracts the shuffle-animation timing that currently lives inside `SettingsPanel` so both the settings panel and the new floating button drive the exact same animation/timeout logic instead of duplicating it.

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

### `SettingsPanel`

Replace the local `shuffling` state, `shuffleTimeoutRef`, cleanup effect, and `handleShuffleClick` with:

```ts
const { shuffling, trigger: handleShuffleClick } = useShuffleAnimation(onShuffle)
```

No other behavior changes — same overlay, same button, same 2s delay.

### `App.tsx`

- Import `Dice3D` and `useShuffleAnimation`.
- Add `const { shuffling, trigger: handleShuffle } = useShuffleAnimation(shuffleNames)`.
- Add a new floating button, same visual style as the settings button, positioned directly to its left:

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
```

- Render the fullscreen shuffle overlay when triggered from the main screen (mirrors the overlay already used inside `SettingsPanel`, so the visual is identical regardless of where shuffle was triggered from):

```tsx
{shuffling && !settingsOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 pointer-events-none">
    <Dice3D size={140} />
  </div>
)}
```

- The gear button and its `settingsOpen` block are unchanged.

### Interaction with the settings panel

- The floating dice button is hidden (`!settingsOpen`) while the settings panel is open, so there's exactly one shuffle control visible at a time and no ambiguity about which overlay renders. The settings panel's own overlay/animation continues to work exactly as it does today, unaffected by this change.

## Edge Cases

- **Rapid double-click on the new button:** `trigger()` no-ops while `shuffling` is already true (same guard as today), and the button is also `disabled` during that window.
- **Opening settings mid-animation:** not reachable — the floating dice button (and therefore triggering a new animation from the main screen) is hidden whenever settings is open, and the gear button itself has no such restriction today, so this spec doesn't change that. If a shuffle animation is somehow still in flight when settings opens (not currently possible via the UI), the fullscreen overlay's `!settingsOpen` guard means the overlay simply stops rendering — the pending `setTimeout` still calls `shuffleNames` on schedule.

## Testing

- **Hook:** calling `trigger()` sets `shuffling` to `true`, calls `onShuffle` once after 2s, then resets `shuffling` to `false`. Calling `trigger()` again while `shuffling` is `true` is a no-op.
- **App:** the new floating dice button renders with `aria-label="Shuffle order"`; clicking it shows the fullscreen overlay with the large `Dice3D`; after the animation, `shuffleNames` has been called and the overlay is gone. The button is not rendered while `settingsOpen` is `true`.
- **SettingsPanel:** existing shuffle tests continue to pass unchanged (behavior identical, only the state source moved into the shared hook).
