# Shuffle Speaker Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 🎲 Shuffle order button to the SettingsPanel that randomises speaker order using Fisher-Yates.

**Architecture:** A `shuffleNames` action is added to `settingsStore` (Fisher-Yates on a copy of `names`). `App.tsx` passes it as `onShuffle` to `SettingsPanel`. The button sits after the `+ Add speaker` button inside the speakers block.

**Tech Stack:** React 18, TypeScript, Zustand 5, Vitest 2 + Testing Library

---

## File Map

| Action | File |
|---|---|
| Modify | `src/stores/settingsStore.ts` |
| Modify | `src/stores/settingsStore.test.ts` |
| Modify | `src/components/SettingsPanel.tsx` |
| Modify | `src/components/SettingsPanel.test.tsx` |
| Modify | `src/App.tsx` |

---

### Task 1: Add `shuffleNames` action to settingsStore

**Files:**
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/stores/settingsStore.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside the `describe('settingsStore')` block in `src/stores/settingsStore.test.ts`:

```ts
it('shuffleNames returns the same names in any order', () => {
  useSettingsStore.setState({ names: ['Alice', 'Bob', 'Carol'], timeLimitMinutes: 15 })
  useSettingsStore.getState().shuffleNames()
  const { names } = useSettingsStore.getState()
  expect(names).toHaveLength(3)
  expect(names).toEqual(expect.arrayContaining(['Alice', 'Bob', 'Carol']))
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/stores/settingsStore.test.ts
```

Expected: FAIL — `shuffleNames is not a function`

- [ ] **Step 3: Add `shuffleNames` to `settingsStore.ts`**

Add `shuffleNames: () => void` to the `SettingsState` interface and add the implementation. Full file after changes:

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  names: string[]
  timeLimitMinutes: number
  setNames: (names: string[]) => void
  addName: (name: string) => void
  removeName: (name: string) => void
  setTimeLimitMinutes: (minutes: number) => void
  shuffleNames: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      names: ['test speaker'],
      timeLimitMinutes: 15,
      setNames: (names) => set({ names }),
      addName: (name) => set((s) => ({ names: [...s.names, name] })),
      removeName: (name) => set((s) => ({ names: s.names.filter((n) => n !== name) })),
      setTimeLimitMinutes: (timeLimitMinutes) => set({ timeLimitMinutes }),
      shuffleNames: () =>
        set((s) => {
          const arr = [...s.names]
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
          }
          return { names: arr }
        }),
    }),
    {
      name: 'stagetime-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

- [ ] **Step 4: Run all settingsStore tests to verify they pass**

```bash
npx vitest run src/stores/settingsStore.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/settingsStore.ts src/stores/settingsStore.test.ts
git commit -m "feat: add shuffleNames action to settingsStore"
```

---

### Task 2: Add shuffle button to SettingsPanel

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/SettingsPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Add `onShuffle: vi.fn()` to `baseProps` in `src/components/SettingsPanel.test.tsx`:

```ts
const baseProps = {
  names: ['Alice', 'Bob'],
  timeLimitMinutes: 15,
  onAddName: vi.fn(),
  onRemoveName: vi.fn(),
  onChangeName: vi.fn(),
  onSetTimeLimit: vi.fn(),
  onShuffle: vi.fn(),
  onClose: vi.fn(),
}
```

Then add the new test:

```ts
it('calls onShuffle when shuffle button is clicked', async () => {
  const onShuffle = vi.fn()
  render(<SettingsPanel {...baseProps} onShuffle={onShuffle} />)
  await userEvent.click(screen.getByRole('button', { name: /shuffle order/i }))
  expect(onShuffle).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/SettingsPanel.test.tsx
```

Expected: FAIL — TypeScript error on missing `onShuffle` prop, and button not found.

- [ ] **Step 3: Add `onShuffle` prop and button to `SettingsPanel.tsx`**

Full file after changes:

```tsx
import { useState, useEffect } from 'react'

interface Props {
  names: string[]
  timeLimitMinutes: number
  onAddName: () => void
  onRemoveName: (name: string) => void
  onChangeName: (oldName: string, newName: string) => void
  onSetTimeLimit: (minutes: number) => void
  onShuffle: () => void
  onClose: () => void
}

export function SettingsPanel({
  names,
  timeLimitMinutes,
  onAddName,
  onRemoveName,
  onChangeName,
  onSetTimeLimit,
  onShuffle,
  onClose,
}: Props) {
  const [timeValue, setTimeValue] = useState(String(timeLimitMinutes))
  useEffect(() => { setTimeValue(String(timeLimitMinutes)) }, [timeLimitMinutes])

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Settings</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time limit (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={timeValue}
              onChange={(e) => {
                setTimeValue(e.target.value)
                const num = Number(e.target.value)
                if (e.target.value !== '' && !isNaN(num)) onSetTimeLimit(num)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Speakers</p>
            <div className="flex flex-col gap-2">
              {names.map((name, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    defaultValue={name}
                    onBlur={(e) => {
                      if (e.target.value !== name) onChangeName(name, e.target.value)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemoveName(name)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={onAddName}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add speaker
            </button>
            <button
              onClick={onShuffle}
              className="mt-2 w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              🎲 Shuffle order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all SettingsPanel tests to verify they pass**

```bash
npx vitest run src/components/SettingsPanel.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/SettingsPanel.test.tsx
git commit -m "feat: add shuffle order button to SettingsPanel"
```

---

### Task 3: Wire shuffle in App.tsx

**Files:**
- Modify: `src/App.tsx`

No new tests — `App.tsx` is a wiring layer; the store and component are tested in isolation.

- [ ] **Step 1: Add `shuffleNames` to the destructure and pass as `onShuffle`**

In `src/App.tsx`, update line 11 to include `shuffleNames`:

```ts
const { setNames, addName, removeName, setTimeLimitMinutes, timeLimitMinutes, shuffleNames } = useSettingsStore()
```

Then add `onShuffle={shuffleNames}` to the `SettingsPanel` usage (after `onSetTimeLimit`):

```tsx
<SettingsPanel
  names={names}
  timeLimitMinutes={timeLimitMinutes}
  onAddName={() => addName(`Speaker ${names.length + 1}`)}
  onRemoveName={removeName}
  onChangeName={handleChangeName}
  onSetTimeLimit={setTimeLimitMinutes}
  onShuffle={shuffleNames}
  onClose={() => setSettingsOpen(false)}
/>
```

- [ ] **Step 2: Run the full test suite to verify no regressions**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire shuffleNames into SettingsPanel via App"
```
