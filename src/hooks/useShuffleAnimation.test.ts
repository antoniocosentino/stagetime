import { renderHook, act } from '@testing-library/react'
import { useShuffleAnimation } from './useShuffleAnimation'

afterEach(() => vi.useRealTimers())

it('starts with shuffling false', () => {
  const { result } = renderHook(() => useShuffleAnimation(vi.fn()))
  expect(result.current.shuffling).toBe(false)
})

it('sets shuffling to true immediately on trigger', () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useShuffleAnimation(vi.fn()))
  act(() => {
    result.current.trigger()
  })
  expect(result.current.shuffling).toBe(true)
})

it('calls onShuffle only after 2 seconds, then resets shuffling', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  const { result } = renderHook(() => useShuffleAnimation(onShuffle))

  act(() => {
    result.current.trigger()
  })
  expect(onShuffle).not.toHaveBeenCalled()

  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(onShuffle).not.toHaveBeenCalled()
  expect(result.current.shuffling).toBe(true)

  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(onShuffle).toHaveBeenCalledTimes(1)
  expect(result.current.shuffling).toBe(false)
})

it('ignores additional trigger calls while already shuffling', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  const { result } = renderHook(() => useShuffleAnimation(onShuffle))

  act(() => {
    result.current.trigger()
    result.current.trigger()
    result.current.trigger()
  })

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(onShuffle).toHaveBeenCalledTimes(1)
})

it('clears the pending timeout on unmount', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  const { result, unmount } = renderHook(() => useShuffleAnimation(onShuffle))

  act(() => {
    result.current.trigger()
  })
  unmount()

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(onShuffle).not.toHaveBeenCalled()
})
