import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import App from './App'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'
import { generateRecapImageBlob, saveRecapImage } from './utils/recapImage'

vi.mock('./utils/recapImage', () => ({
  generateRecapImageBlob: vi.fn(async () => new Blob(['fake'], { type: 'image/png' })),
  saveRecapImage: vi.fn(async () => undefined),
}))

beforeEach(() => {
  vi.mocked(generateRecapImageBlob).mockClear()
  vi.mocked(saveRecapImage).mockClear()
  localStorage.clear()
  sessionStorage.clear()
  useSettingsStore.setState({ names: ['Alice'], timeLimitMinutes: 15, idleTimeMinutes: 1, squareModeEnabled: false })
  useTimerStore.setState({
    speakers: {},
    globalRunning: false,
    globalElapsed: 0,
    currentSpeaker: null,
    idleElapsed: 0,
    segments: [],
    activeSegmentStart: null,
    idleSegmentStart: null,
    lastTickTime: null,
  })
})

it('creates a timer entry for each name on mount', () => {
  render(<App />)
  expect(useTimerStore.getState().speakers['Alice']).toBeDefined()
})

it('adds a timer entry when a new name is added to settings', () => {
  render(<App />)
  act(() => {
    useSettingsStore.getState().addName('Bob')
  })
  expect(useTimerStore.getState().speakers['Bob']).toBeDefined()
})

it('removes the timer entry when a name is removed from settings', () => {
  useTimerStore.setState({ speakers: { Alice: { elapsed: 10 } } })
  render(<App />)
  act(() => {
    useSettingsStore.getState().removeName('Alice')
  })
  expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
})

it('squares the cards and mounts the resize indicator when square mode is on', () => {
  useSettingsStore.setState({ squareModeEnabled: true })
  const { container } = render(<App />)
  expect(container.querySelector('.rounded-xl')?.className).toContain('aspect-square')
  expect(screen.getByTestId('square-mode-indicator')).toBeInTheDocument()
})

it('does not square cards or mount the resize indicator when square mode is off', () => {
  useSettingsStore.setState({ squareModeEnabled: false })
  const { container } = render(<App />)
  expect(container.querySelector('.rounded-xl')?.className).not.toContain('aspect-square')
  expect(screen.queryByTestId('square-mode-indicator')).not.toBeInTheDocument()
})

it('renders a floating shuffle button next to the settings button', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: /shuffle order/i })).toBeInTheDocument()
})

it('shows the fullscreen dice overlay and calls shuffleNames after clicking the floating shuffle button', () => {
  vi.useFakeTimers()
  render(<App />)
  const button = screen.getByRole('button', { name: /shuffle order/i })

  fireEvent.click(button)
  expect(button).toBeDisabled()
  expect(document.querySelector('.bg-black\\/40')?.className).toContain('backdrop-blur-md')

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(document.querySelector('.bg-black\\/40')).not.toBeInTheDocument()
  expect(button).not.toBeDisabled()
  vi.useRealTimers()
})

it('hides the floating shuffle button while settings is open', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
  const shuffleButtons = screen.getAllByRole('button', { name: /shuffle order/i })
  expect(shuffleButtons).toHaveLength(1)
})

it('disables the settings gear button while the floating shuffle animation is running', () => {
  vi.useFakeTimers()
  render(<App />)
  const gearButton = screen.getByRole('button', { name: /open settings/i })
  const shuffleButton = screen.getByRole('button', { name: /shuffle order/i })

  expect(gearButton).not.toBeDisabled()

  fireEvent.click(shuffleButton)
  expect(gearButton).toBeDisabled()

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(gearButton).not.toBeDisabled()
  vi.useRealTimers()
})

it('does not render the export recap button when no time has elapsed', () => {
  render(<App />)
  expect(screen.queryByRole('button', { name: /export recap/i })).not.toBeInTheDocument()
})

it('renders the export recap button once the timer has elapsed time', () => {
  useTimerStore.setState({ globalElapsed: 30 })
  render(<App />)
  expect(screen.getByRole('button', { name: /export recap/i })).toBeInTheDocument()
})

it('hides the export recap button while settings is open', () => {
  useTimerStore.setState({ globalElapsed: 30 })
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
  expect(screen.queryByRole('button', { name: /export recap/i })).not.toBeInTheDocument()
})

it('disables the export recap button while the shuffle animation is running', () => {
  vi.useFakeTimers()
  useTimerStore.setState({ globalElapsed: 30 })
  render(<App />)
  const shuffleButton = screen.getByRole('button', { name: /shuffle order/i })
  const exportButton = screen.getByRole('button', { name: /export recap/i })
  expect(exportButton).not.toBeDisabled()

  fireEvent.click(shuffleButton)
  expect(exportButton).toBeDisabled()

  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(exportButton).not.toBeDisabled()
  vi.useRealTimers()
})

it('generates and saves a recap image when the export recap button is clicked', async () => {
  useTimerStore.setState({ globalElapsed: 30 })
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: /export recap/i }))

  await waitFor(() => expect(saveRecapImage).toHaveBeenCalledTimes(1))
  expect(generateRecapImageBlob).toHaveBeenCalledTimes(1)
})
