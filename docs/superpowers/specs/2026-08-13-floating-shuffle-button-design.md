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
  const isShufflingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function trigger() {
    if (isShufflingRef.current) return
    isShufflingRef.current = true
    setShuffling(true)
    timeoutRef.current = setTimeout(() => {
      onShuffle()
      setShuffling(false)
      isShufflingRef.current = false
    }, 2000)
  }

  return { shuffling, trigger }
}
```

Note the re-entrancy guard reads `isShufflingRef` (a ref), not the `shuffling` state — reading state directly would be stale within a single synchronous batch (e.g. multiple `trigger()` calls before a re-render), which could let `onShuffle` fire more than once.

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

- The `settingsOpen` block is unchanged. The gear button additionally gets `disabled={shuffling}` (see Edge Cases below).

### Interaction with the settings panel

- The floating dice button is hidden (`!settingsOpen`) while the settings panel is open, so there's exactly one shuffle control visible at a time and no ambiguity about which overlay renders. The settings panel's own overlay/animation continues to work exactly as it does today, unaffected by this change.

## Edge Cases

- **Rapid double-click on the new button:** `trigger()` no-ops while `shuffling` is already true (same guard as today), and the button is also `disabled` during that window.
- **Opening settings mid-animation:** the gear button is `disabled={shuffling}`, so it cannot be clicked while a main-screen shuffle animation is in flight — this prevents the settings panel from opening (and truncating the overlay, or racing a second `useShuffleAnimation` instance) while `shuffling` is `true`.

## Testing

- **Hook:** calling `trigger()` sets `shuffling` to `true`, calls `onShuffle` once after 2s, then resets `shuffling` to `false`. Calling `trigger()` again while `shuffling` is `true` is a no-op.
- **App:** the new floating dice button renders with `aria-label="Shuffle order"`; clicking it shows the fullscreen overlay with the large `Dice3D`; after the animation, `shuffleNames` has been called and the overlay is gone. The button is not rendered while `settingsOpen` is `true`.
- **SettingsPanel:** existing shuffle tests continue to pass unchanged (behavior identical, only the state source moved into the shared hook).
