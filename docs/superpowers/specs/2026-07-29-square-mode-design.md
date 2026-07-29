# Square mode

## Problem

Users running stagetime as a full-screen or projected timer sometimes want speaker cards to be square, and want to size their browser window into a square shape for the display. A page cannot resize the browser window it's running in (browsers only allow `window.resizeTo()` on windows the script itself opened via `window.open()`, and never on the tab/window the user is already browsing in) — so an automatic resize is not possible.

## Solution

Add a "Square mode" toggle to the settings panel. When enabled:

1. Speaker cards render as perfect squares instead of their current content-driven rectangle.
2. A small on-screen indicator shows the live browser window dimensions while the user manually resizes it, so they can drag the window into a square themselves with precision. The indicator appears while resizing and fades out shortly after the user stops.

When disabled, cards return to today's layout and the indicator is removed entirely (no listeners, no UI).

## Settings & state

- Add `squareModeEnabled: boolean` (default `false`) to `settingsStore.ts`, with a `setSquareModeEnabled(enabled: boolean)` action.
- Persisted via the existing `persist` middleware, same as `timeLimitMinutes` / `idleTimeMinutes`.
- `SettingsPanel.tsx` gets a new toggle row labeled "Square mode" — the first boolean control in the panel, styled consistently with existing inputs (a switch, not a checkbox input, to match the panel's visual language).

## Square cards

- `MainView` reads `squareModeEnabled` from the store and passes it to each `SpeakerCard`.
- `SpeakerCard` conditionally applies Tailwind's `aspect-square` class to its root element when the flag is true, forcing a 1:1 box regardless of content height.
- The surrounding grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`) is unchanged — only the individual card shape changes.
- Toggled off → `aspect-square` is omitted and cards return to their current content-driven height.

## Resize indicator (`SquareModeIndicator`)

- New component `src/components/SquareModeIndicator.tsx`.
- Rendered in `App.tsx` only when `squareModeEnabled` is true: `{squareModeEnabled && <SquareModeIndicator />}`, mirroring the existing conditional mount pattern used for `SettingsPanel`. This means the resize listener only exists while the feature is enabled — no cleanup-on-disable logic needed beyond the normal effect cleanup on unmount.
- Behavior:
  - Attaches a `resize` listener to `window` on mount; removes it on unmount.
  - On each `resize` event, reads `window.outerWidth` and `window.outerHeight` (the full OS window frame — the value the user is directly controlling by dragging the window edge) and updates displayed text to `"{width} × {height}"` in a monospace font.
  - Sets `visible = true` on every resize event, and (re)starts a 600ms timer (stored in a ref, cleared and restarted on every event — not re-created as a new interval) that sets `visible = false` when it elapses. This debounces "the user stopped resizing."
  - When `|width - height| <= 2` (a 2px tolerance, since manual dragging rarely lands on an exact pixel match), the indicator's text/border renders in green; otherwise neutral gray.
  - The visibility transition is a ~250ms opacity fade (CSS transition), and the element has `pointer-events-none` so it never intercepts clicks.
- Positioning: `fixed`, bottom-left corner, mirroring the existing bottom-right settings gear button's fixed-corner styling (rounded pill, shadow, similar spacing).

## Edge cases

- jsdom (the test environment) defaults `window.outerWidth` / `outerHeight` to `0`. Tests must explicitly set these properties before dispatching a `resize` event.
- Rapid-fire resize events during a drag must not create multiple competing timers — the hide-timer is stored in a `useRef` and cleared before each restart.
- Toggling Square mode off while a resize is in progress unmounts the indicator immediately (React removes it as soon as `squareModeEnabled` flips), which is acceptable — there's no expectation the indicator persists across the setting being turned off.

## Testing

- `settingsStore.test.ts`: default `squareModeEnabled` is `false`; `setSquareModeEnabled` updates state; value persists through the existing persistence mechanism.
- `SettingsPanel.test.tsx`: toggle renders with correct label/state and calls the provided handler on interaction.
- `SquareModeIndicator.test.tsx` (new):
  - Renders current `outerWidth × outerHeight` text after a `resize` event.
  - Applies the "square" (green) styling when width/height are within 2px of each other, neutral styling otherwise.
  - Fades out (visibility/opacity state flips) 600ms after the last `resize` event, using fake timers.
  - Removes its `resize` listener on unmount (no state updates / errors after unmount).
- `MainView.test.tsx` / `SpeakerCard.test.tsx`: `aspect-square` class is present when `squareModeEnabled` is true and absent when false.

## Out of scope

- Actually resizing the browser window (not possible from a normal web page).
- Any popup-window-based workaround — rejected in favor of the manual-resize + indicator approach, which keeps everything within the single window/tab the user is already using.
