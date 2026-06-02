import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerCard } from './SpeakerCard'

const baseProps = {
  name: 'Alice',
  elapsed: 60,
  isCurrentSpeaker: false,
  allottedSeconds: 300,
  color: '#3b82f6',
  onSelect: vi.fn(),
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

it('renders a single "Currently speaking" button', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.getByRole('button', { name: 'Currently speaking' })).toBeInTheDocument()
})

it('button has outlined style when not current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={false} />)
  const btn = container.querySelector('button')!
  expect(btn.className).toContain('border-gray-300')
})

it('button has filled blue style when current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={true} />)
  const btn = container.querySelector('button')!
  expect(btn.className).toContain('bg-blue-600')
})

it('card has ring styling when current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={true} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).toContain('ring-2')
})

it('card has no ring styling when not current speaker', () => {
  const { container } = render(<SpeakerCard {...baseProps} isCurrentSpeaker={false} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).not.toContain('ring-2')
})

it('calls onSelect when button is clicked', async () => {
  const onSelect = vi.fn()
  render(<SpeakerCard {...baseProps} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: 'Currently speaking' }))
  expect(onSelect).toHaveBeenCalledTimes(1)
})

it('shows time display in red when elapsed exceeds allotted', () => {
  const { container } = render(<SpeakerCard {...baseProps} elapsed={400} allottedSeconds={300} />)
  const display = container.querySelector('[data-testid="time-display"]') as HTMLElement
  expect(display.className).toContain('text-red')
})

it('renders color dot with correct background color', () => {
  const { container } = render(<SpeakerCard {...baseProps} color="#3b82f6" />)
  const dot = container.querySelector('[data-testid="color-dot"]') as HTMLElement
  expect(dot.style.backgroundColor).toBe('rgb(59, 130, 246)')
})
