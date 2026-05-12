# Speaker Colors + Chronological Segmented Global Bar

**Date:** 2026-05-12
**Status:** Approved

## Overview

Add a color identity to each speaker and replace the single-fill global progress bar with a chronological segmented bar that visualizes the actual speaking order across the session.

## Data Model

### `timerStore` additions

```ts
segments: Array<{ name: string; duration: number }>
activeSegmentStart: Record<string, number>
```

`segments` is an append-only, chronological log of completed speaking runs. Each entry records who spoke and for how long (seconds). Order reflects the real speaking sequence; a speaker can appear multiple times.

`activeSegmentStart` maps a running speaker's name to their elapsed-time snapshot at the moment their current run began. Used to compute in-progress segment duration without any additional ticking state.

### State transitions

| Action | Segment effect |
|---|---|
| `startSpeaker(name)` | Finalize any currently-running speaker's segment → push to `segments`. Set `activeSegmentStart[name] = speakers[name].elapsed`. |
| `pauseSpeaker(name)` | Push `{ name, duration: elapsed - activeSegmentStart[name] }` to `segments`. Delete `activeSegmentStart[name]`. |
| `resetSpeaker(name)` | Filter `segments` to remove all entries where `entry.name === name`. Delete `activeSegmentStart[name]`. Reset elapsed to 0. |
| `removeSpeaker(name)` | Same as reset, plus remove from `speakers` map. |
| `tickRunning(delta)` | Unchanged — segment tracking is event-driven, not tick-driven. |

**Re-start guard:** `startSpeaker` only finalizes a segment if `activeSegmentStart[name]` exists, preventing a zero-duration push when the same speaker is started while already running.

## Color Palette

A fixed array of 8 colors (blues, greens, purples, oranges — no red) exported as `COLORS: string[]` from a shared constants file.

Color assignment: `COLORS[names.indexOf(speakerName) % COLORS.length]`.

`MainView` computes `colorMap: Record<string, string>` from the names array and passes it to child components. Colors are never persisted.

## Components

### `SpeakerCard`
- New prop: `color: string`
- Renders a 12px filled `rounded-full` circle left of the speaker name
- Passes `color` to `ProgressBar` to override the default green fill

### `ProgressBar`
- New optional prop: `color?: string`
- When present: use as bar fill color regardless of progress value
- When absent: keep existing green (≤100%) / red (>100%) behavior

### `GlobalTimer`
- Replaces the single `ProgressBar` with a flex-row of proportional colored `div` segments
- Receives `segments: Array<{ name: string; duration: number; color: string }>` from `MainView`
- Each segment's width: `(duration / totalSeconds) * 100%`, capped so total never exceeds 100%
- An in-progress segment (speaker currently running) is included and grows live as ticks advance
- Overtime: bar stays full, the existing label handles the overtime signal

### `MainView`
- Computes `colorMap` from `names`
- Builds the segment array for `GlobalTimer`:
  1. Take `timerStore.segments` (completed runs)
  2. If a speaker is currently running, append a synthetic `{ name, duration: elapsed - activeSegmentStart[name] }` entry
  3. Map each entry to include `color` via `colorMap`

## Edge Cases

- **Same speaker started while already running:** `startSpeaker` guard prevents zero-duration segment push; no visible effect.
- **All speakers paused:** `GlobalTimer` renders only completed segments; in-progress entry omitted.
- **Total elapsed > time limit:** segment widths are proportionally normalized to stay within 100% total width. Overtime is communicated by the label only.
- **Palette wrap:** with 9+ speakers, colors repeat (`index % 8`). Acceptable for this app's typical scale.

## Testing

All new store behavior is tested via TDD (failing test first):

- `startSpeaker` finalizes the previously-running speaker's segment before starting the new one
- `pauseSpeaker` pushes a segment entry with correct duration
- `resetSpeaker` removes only that speaker's segments, leaving others intact
- `removeSpeaker` also clears that speaker's segments
- Re-starting the same speaker does not produce a zero-duration segment

Component tests:
- `GlobalTimer` renders one segment per entry with correct proportional widths and colors
- `SpeakerCard` renders the color dot with the correct background color
