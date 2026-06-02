# Speaker Card Clickable Design

**Date:** 2026-06-03

## Problem

The "Currently speaking" button on each `SpeakerCard` is always visible and interactive, even when the global timer is not running. Marking a speaker as speaking has no effect unless the timer is running, so the button is misleading in the paused/stopped state.

## Goal

- Remove the CTA button entirely
- Make the whole speaker card the click target for toggling the current speaker
- The card is only interactive (and shows a pointer cursor) when the timer is running
- Clicking an already-selected speaker deselects it

## Design

### SpeakerCard (`src/components/SpeakerCard.tsx`)

- Change `onSelect: () => void` to `onSelect?: () => void` (optional)
- Remove the `<button>` element
- Add `onClick={onSelect}` to the outer wrapper `<div>`
- Add `cursor-pointer` to the outer `<div>` class only when `onSelect` is defined
- The existing `ring-2 ring-blue-500` active-speaker highlight is unchanged

### MainView (`src/components/MainView.tsx`)

- Pass `onSelect` to `SpeakerCard` only when `globalRunning` is `true`:

```ts
onSelect={
  globalRunning
    ? () => setCurrentSpeaker(currentSpeaker === name ? null : name)
    : undefined
}
```

- No other changes to `MainView`

## Behaviour

| Timer state     | Card cursor | Click effect              |
|-----------------|-------------|---------------------------|
| Running         | `pointer`   | toggles speaker on/off    |
| Paused/stopped  | `default`   | nothing                   |

The `currentSpeaker` selection persists across pause/resume — this is correct; resuming continues attributing time to the already-selected speaker.

## Out of scope

- No visual dimming of cards when timer is stopped
- No tooltip or affordance hinting "start the timer first"
- No changes to `timerStore`
