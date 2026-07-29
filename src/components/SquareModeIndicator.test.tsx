import { render, screen, fireEvent, act } from '@testing-library/react'
import { SquareModeIndicator } from './SquareModeIndicator'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setWindowSize(width: number, height: number) {
  window.outerWidth = width
  window.outerHeight = height
}

it('shows current outer width and height after a resize event', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator')).toHaveTextContent('900 × 500')
})

it('is visible immediately after a resize event', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-100')
})

it('applies green square styling when width and height are within 2px', () => {
  render(<SquareModeIndicator />)
  setWindowSize(800, 799)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator').className).toContain('text-green-400')
})

it('applies neutral styling when width and height differ by more than 2px', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  expect(screen.getByTestId('square-mode-indicator').className).toContain('text-white')
})

it('fades out 600ms after the last resize event', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(600)
  })
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-0')
})

it('does not fade out before 600ms have elapsed', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-100')
})

it('resets the hide timer on repeated resize events', () => {
  render(<SquareModeIndicator />)
  setWindowSize(900, 500)
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  fireEvent.resize(window)
  act(() => {
    vi.advanceTimersByTime(500)
  })
  expect(screen.getByTestId('square-mode-indicator').className).toContain('opacity-100')
})

it('removes the resize listener on unmount without throwing', () => {
  const { unmount } = render(<SquareModeIndicator />)
  unmount()
  expect(() => fireEvent.resize(window)).not.toThrow()
})
