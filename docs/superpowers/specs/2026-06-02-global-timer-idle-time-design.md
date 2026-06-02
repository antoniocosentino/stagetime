# Global Timer, Idle Time & Speaker Controls — Design

**Date:** 2026-06-02  
**Status:** Approved

---

## Overview

Introduce a global meeting timer with start/pause/reset controls, an "idle time" concept (time passing without a named speaker), a predicted idle time setting, updated per-speaker time allocation, and a fix for the tab-visibility timer bug.

---

## 1. Settings Store

**New field in `settingsStore`:**
- `idleTimeMinutes: number` — defaults to `1`
- `setIdleTimeMinutes(minutes: number)` — setter

Persisted to `localStorage` alongside existing settings.

---

## 2. Timer Store — State Model

Remove `running` from individual speaker entries. Add global timer, current speaker, and idle tracking.

```typescript
// Per-speaker: elapsed only, no running flag
speakers: Record<string, { elapsed: number }>

// Global timer
globalRunning: boolean
globalElapsed: number          // total accumulated seconds (global clock)

// Who is currently speaking; null = idle
currentSpeaker: string | null

// Total idle seconds accumulated
idleElapsed: number

// Completed stints for the progress bar
segments: Array<{ name: string; duration: number; type: 'speaker' | 'idle' }>

// Segment tracking — global elapsed value at which the current stint started
activeSegmentStart: number | null   // current speaker's active stint start
idleSegmentStart: number | null     // current idle period start

// Wall-clock delta tracking (tab-safety)
lastTickTime: number | null
```

---

## 3. Timer Store — Actions

### `tick()`
Replaces `tickRunning(delta)`. Called every 100ms from `App.tsx`.

```
delta = (Date.now() - lastTickTime) / 1000
lastTickTime = Date.now()
```

- If `lastTickTime` was null: set it to now, skip this tick (delta = 0).
- If `globalRunning`:
  - Increment `globalElapsed += delta`
  - If `currentSpeaker` is set: increment `speakers[currentSpeaker].elapsed += delta`
  - Else: increment `idleElapsed += delta`

Tab-safety: when a background tab wakes up, the single large delta is applied correctly — the timer catches up in one tick.

### `startGlobal()`
- Sets `globalRunning = true`, `lastTickTime = Date.now()`
- If `currentSpeaker` is null and `idleSegmentStart` is null: set `idleSegmentStart = globalElapsed`
- If `currentSpeaker` is set and `activeSegmentStart` is null: set `activeSegmentStart = globalElapsed`

### `pauseGlobal()`
- Sets `globalRunning = false`
- Commits the current active stint to `segments`:
  - If `currentSpeaker` is set: push `{ name: currentSpeaker, duration: globalElapsed - activeSegmentStart, type: 'speaker' }`, clear `activeSegmentStart`
  - If idle: push `{ name: '__idle__', duration: globalElapsed - idleSegmentStart, type: 'idle' }`, clear `idleSegmentStart`

### `resetAll()`
- Zeroes: `globalElapsed = 0`, `idleElapsed = 0`, all `speakers[*].elapsed = 0`
- Clears: `segments = []`, `globalRunning = false`, `currentSpeaker = null`
- Clears: `activeSegmentStart = null`, `idleSegmentStart = null`, `lastTickTime = null`

### `setCurrentSpeaker(name: string | null)`
Can be called whether the timer is running or paused.

1. **Commit previous stint:**
   - If `currentSpeaker` was set and `activeSegmentStart` is not null: push speaker segment, clear `activeSegmentStart`
   - If `currentSpeaker` was null and `idleSegmentStart` is not null: push idle segment, clear `idleSegmentStart`
2. **Set new speaker:**
   - If `name` is a speaker: set `currentSpeaker = name`, set `activeSegmentStart = globalElapsed`
   - If `null`: set `currentSpeaker = null`, set `idleSegmentStart = globalElapsed`

### Speaker reconciliation (in `App.tsx`)
When a speaker is removed from settings while they are `currentSpeaker`, call `setCurrentSpeaker(null)` to return to idle.

---

## 4. Utility — `timePerSpeaker`

Updated signature:

```typescript
function timePerSpeaker(
  timeLimitMinutes: number,
  idleTimeMinutes: number,
  speakerCount: number
): number {
  return ((timeLimitMinutes - idleTimeMinutes) * 60) / speakerCount
}
```

Example: 16 min limit, 1 min idle, 5 speakers → (16 - 1) × 60 / 5 = 180s = 3 min each.

---

## 5. UI — `SettingsPanel`

Below the "Time limit (minutes)" field, add a "Predicted idle time (minutes)" number input.
- Same styling as the time limit field
- Min value: 0
- Default: 1
- Bound to `idleTimeMinutes` in settings store

---

## 6. UI — `GlobalTimer`

### Controls
Add a row of controls to the right of the time label (or below the label, above the bar):
- **Start / Pause** toggle button — shows "Start" when `globalRunning = false`, "Pause" when `globalRunning = true`
- **Reset** button — always visible, calls `resetAll()`

### Progress bar
The progress bar renders three kinds of segments in order:

1. **Committed segments** from `segments[]`:
   - `type: 'speaker'` → solid color from `colorMap[name]`
   - `type: 'idle'` → diagonal grey/white stripe pattern (CSS `repeating-linear-gradient`)

2. **Live in-flight segment** (appended if timer is running):
   - If `currentSpeaker` is set: colored segment, duration = `globalElapsed - activeSegmentStart`
   - If idle: striped segment, duration = `globalElapsed - idleSegmentStart`
   - (`activeSegmentStart` / `idleSegmentStart` are always set when the timer is running, so no null fallback needed)

Only segments with `duration > 0` are rendered.

**Zebra CSS pattern for idle segments:**
```css
background: repeating-linear-gradient(
  45deg,
  #d1d5db,
  #d1d5db 4px,
  #f9fafb 4px,
  #f9fafb 8px
);
```

---

## 7. UI — `SpeakerCard`

### CTA change
Replace the Start/Pause + Reset button pair with a single **"Currently speaking"** toggle button (full width).

- **Inactive state** (speaker is not `currentSpeaker`): grey outline style, label "Currently speaking"
- **Active state** (speaker is `currentSpeaker`): blue filled style, label "Currently speaking"

Behaviour:
- Clicking an inactive card → calls `setCurrentSpeaker(name)` (previous speaker is automatically cleared inside the action)
- Clicking the active card → calls `setCurrentSpeaker(null)` (returns to idle)

### Card expansion
Card expands (same visual treatment as the previous `running` state) when `name === currentSpeaker`.

### Props changes
Remove: `onStart`, `onPause`, `onReset`, `running`  
Add: `isCurrentSpeaker: boolean`, `onSelect: () => void`

---

## 8. Wiring — `MainView`

- `totalElapsed` passed to `GlobalTimer` becomes `globalElapsed` directly (no longer summed from speakers)
- `allotted` per speaker uses updated `timePerSpeaker(timeLimitMinutes, idleTimeMinutes, names.length)`
- Passes `globalRunning`, `startGlobal`, `pauseGlobal`, `resetAll`, `currentSpeaker`, `setCurrentSpeaker` to `GlobalTimer` and `SpeakerCard`s

---

## 9. Wiring — `App.tsx`

- `useInterval` tick calls `timerStore.getState().tick()` (replaces `tickRunning(0.1)`)
- Speaker reconciliation: if a removed speaker was `currentSpeaker`, call `setCurrentSpeaker(null)`
- No other changes to `App.tsx`

---

## 10. Files Changed

| File | Change |
|------|--------|
| `settingsStore.ts` | Add `idleTimeMinutes`, `setIdleTimeMinutes` |
| `timerStore.ts` | Full refactor per sections 2–3 |
| `utils/time.ts` | Update `timePerSpeaker` signature |
| `components/GlobalTimer.tsx` | Add controls, idle segment rendering |
| `components/SpeakerCard.tsx` | Replace Start/Pause/Reset with "Currently speaking" toggle |
| `components/SettingsPanel.tsx` | Add idle time field |
| `components/MainView.tsx` | Updated wiring |
| `App.tsx` | tick → `tick()`, reconciliation update |
| All `.test.*` files | Update to new interfaces |
