import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerCard } from './SpeakerCard'

const baseProps = {
  name: 'Alice',
  elapsed: 60,
  running: false,
  allottedSeconds: 300,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

it('renders the speaker name', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByText('Alice')).toBeInTheDocument()
})

it('shows elapsed / allotted time as formatted strings', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByText('1:00 / 5:00')).toBeInTheDocument()
})

it('shows Start button when not running', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
})

it('shows Pause button when running', () => {
  render(<SpeakerCard {...baseProps} running={true} />)
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
})

it('calls onStart when Start is clicked', async () => {
  const onStart = vi.fn()
  render(<SpeakerCard {...baseProps} onStart={onStart} />)
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(onStart).toHaveBeenCalledTimes(1)
})

it('calls onPause when Pause is clicked', async () => {
  const onPause = vi.fn()
  render(<SpeakerCard {...baseProps} running={true} onPause={onPause} />)
  await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
  expect(onPause).toHaveBeenCalledTimes(1)
})

it('calls onReset when Reset is clicked', async () => {
  const onReset = vi.fn()
  render(<SpeakerCard {...baseProps} onReset={onReset} />)
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onReset).toHaveBeenCalledTimes(1)
})

it('shows time display in red when elapsed exceeds allotted', () => {
  const { container } = render(<SpeakerCard {...baseProps} elapsed={400} allottedSeconds={300} />)
  const display = container.querySelector('[data-testid="time-display"]') as HTMLElement
  expect(display.className).toContain('text-red')
})
