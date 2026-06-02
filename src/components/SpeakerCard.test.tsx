import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerCard } from './SpeakerCard'

const baseProps = {
  name: 'Alice',
  elapsed: 60,
  isCurrentSpeaker: false,
  allottedSeconds: 300,
  color: '#3b82f6',
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

it('renders no button', () => {
  render(<SpeakerCard {...baseProps} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
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

it('card has cursor-pointer when onSelect is provided', () => {
  const { container } = render(<SpeakerCard {...baseProps} onSelect={vi.fn()} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).toContain('cursor-pointer')
})

it('card does not have cursor-pointer when onSelect is undefined', () => {
  const { container } = render(<SpeakerCard {...baseProps} />)
  const card = container.querySelector('.rounded-xl') as HTMLElement
  expect(card.className).not.toContain('cursor-pointer')
})

it('calls onSelect when card is clicked and onSelect is provided', async () => {
  const onSelect = vi.fn()
  const { container } = render(<SpeakerCard {...baseProps} onSelect={onSelect} />)
  await userEvent.click(container.querySelector('.rounded-xl')!)
  expect(onSelect).toHaveBeenCalledTimes(1)
})

it('does not throw when card is clicked and onSelect is undefined', async () => {
  const { container } = render(<SpeakerCard {...baseProps} />)
  await expect(
    userEvent.click(container.querySelector('.rounded-xl')!)
  ).resolves.not.toThrow()
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
