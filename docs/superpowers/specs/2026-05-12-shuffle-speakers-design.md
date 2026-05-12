# Shuffle Speaker Order

**Date:** 2026-05-12
**Status:** Approved

## Overview

Add a "🎲 Shuffle order" button to the SettingsPanel (after the speakers block) that randomizes the order of speakers using Fisher-Yates.

## Changes

### `settingsStore`

Add `shuffleNames: () => void` action. Fisher-Yates on a copy of `names`:

```ts
shuffleNames: () =>
  set((s) => {
    const arr = [...s.names]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return { names: arr }
  }),
```

### `SettingsPanel`

Add `onShuffle: () => void` prop. Render a full-width button after the `+ Add speaker` button, inside the speakers `<div>`:

```tsx
<button
  onClick={onShuffle}
  className="mt-2 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
>
  🎲 Shuffle order
</button>
```

### `App.tsx`

Destructure `shuffleNames` from `useSettingsStore` and pass as `onShuffle={shuffleNames}` to `SettingsPanel`.

## Edge Cases

- **0 or 1 speakers:** Fisher-Yates loop body never executes (`i > 0` condition). No-op, no errors.

## Testing

- **Store:** `shuffleNames` produces a `names` array with the same elements in any order; with 2+ speakers, calling it twice on a fixed seed should produce a valid permutation. Practical test: shuffle, verify same set of names, verify length unchanged.
- **Component:** clicking "🎲 Shuffle order" calls `onShuffle` once.
