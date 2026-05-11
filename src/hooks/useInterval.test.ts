import { renderHook, act } from '@testing-library/react'
import { useInterval } from './useInterval'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('calls callback on each interval tick', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, 100))
  expect(callback).not.toHaveBeenCalled()
  act(() => { vi.advanceTimersByTime(300) })
  expect(callback).toHaveBeenCalledTimes(3)
})

it('does not call callback when delay is null', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, null))
  act(() => { vi.advanceTimersByTime(500) })
  expect(callback).not.toHaveBeenCalled()
})

it('always calls the latest callback reference without resetting the interval', () => {
  let count = 0
  const { rerender } = renderHook(
    ({ cb }: { cb: () => void }) => useInterval(cb, 100),
    { initialProps: { cb: () => { count++ } } }
  )
  act(() => { vi.advanceTimersByTime(100) })
  rerender({ cb: () => { count += 10 } })
  act(() => { vi.advanceTimersByTime(100) })
  expect(count).toBe(11)
})
