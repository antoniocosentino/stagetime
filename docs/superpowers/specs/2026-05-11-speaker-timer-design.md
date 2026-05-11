# Speaker Timer — Design Spec

**Date:** 2026-05-11
**Stack:** React + TypeScript + Vite + Tailwind CSS + Zustand

---

## Overview

A single-page application for tracking speaking time during meetings. Multiple speakers each get an equal share of a configurable total time. Individual timers can be started, paused, and reset. A global progress bar reflects total elapsed time across all speakers. Timers continue past zero and show overtime.

---

## Architecture

### Component Tree

```
App
├── SettingsPanel (shown/hidden via gear icon)
│   ├── NameList (add / remove names)
│   └── TimeLimitInput
└── MainView
    ├── GlobalTimer (progress bar + time remaining label, no controls)
    └── SpeakerGrid
        └── SpeakerCard (one per speaker)
            ├── ProgressBar
            └── Controls (start/pause, reset)
```

### State Stores (Zustand)

**`useSettingsStore`** — persisted to `localStorage`

```ts
{
  names: string[]           // ordered list of speaker names
  timeLimitMinutes: number  // total meeting time, default 15
}
```

Default when localStorage is empty: `{ names: ["test speaker"], timeLimitMinutes: 15 }`.

**`useTimerStore`** — persisted to `sessionStorage`

```ts
{
  speakers: Record<string, { elapsed: number, running: boolean }>
  // key: speaker name
  // elapsed: seconds (float, ticks up)
  // running: whether the timer is currently counting
}
```

Timer state is lost when the tab is closed (sessionStorage behaviour). Survives page refresh.

---

## Timer Logic

A single `useInterval` (100ms) runs in `App`. On each tick it finds all speakers with `running: true` and increments their `elapsed` by 0.1 seconds. One interval for all speakers avoids drift and keeps store writes minimal.

**Time allocation:**
```
timePerSpeaker = (timeLimitMinutes * 60) / names.length   (seconds)
```

**Progress values:**
- Individual: `elapsed / timePerSpeaker` — exceeds 1.0 in overtime
- Global: `sum(all elapsed) / (timeLimitMinutes * 60)` — exceeds 1.0 in overtime

Progress bars are capped at 150% width visually; anything above 100% renders in red.

---

## Settings ↔ Timer Reconciliation

Keyed by name string. Runs in a `useEffect` in `App` whenever `names` changes:

- **Name added:** create `{ elapsed: 0, running: false }` entry
- **Name removed:** delete the entry
- **Name edited:** treated as remove + add (elapsed resets for that speaker)

Reordering names does not affect elapsed times.

---

## UI Layout

### Top Bar
- App title (left)
- Gear icon button (right) — opens settings panel

### Global Timer
- Label: "X:XX remaining" (counts down from total; shows "+X:XX overtime" when exceeded)
- Full-width progress bar: green → red past 100%
- No start/stop controls — purely a reflection of individual timer activity

### Speaker Card
- Speaker name (top)
- Time display: `elapsed / allotted` (e.g. "2:14 / 5:00") — turns red in overtime
- Progress bar: fills left-to-right, green within time, red in overtime
- **Start / Pause** button
- **Reset** button (sets elapsed to 0, stops timer)

### Speaker Grid
- Responsive: 1 column on mobile, 2–3 columns on desktop

### Settings Panel
- Slides in from the right (full-height overlay)
- "Time limit" number input (minutes, minimum 1)
- Speaker list: each row has a text input + delete button
- "Add speaker" button below the list
- Close button returns to main view; changes apply immediately

---

## Persistence

| Data | Storage | Cleared when |
|------|---------|--------------|
| `names`, `timeLimitMinutes` | `localStorage` | User clears browser data |
| `elapsed`, `running` per speaker | `sessionStorage` | Tab closed |

---

## Overtime Behaviour

Both individual and global timers continue past zero. Visual indicators:
- Progress bar turns red and can extend beyond full width (capped at 150%)
- Time display turns red
- Global label switches to "+X:XX overtime" format

---

## Out of Scope

- Drag-to-reorder on the main page (order is fixed, set in settings)
- Notifications or sounds when time runs out
- History or export of session data
- Multi-session or server-side persistence
