import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalTimer } from './GlobalTimer'

const baseProps = {
  totalSeconds: 900,
  globalElapsed: 0,
  globalRunning: false,
  segments: [] as { duration: number; color?: string }[],
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

it('shows remaining time label when no time has elapsed', () => {
  render(<GlobalTimer {...baseProps} />)
  expect(screen.getByText('15:00 remaining')).toBeInTheDocument()
})

it('counts down correctly based on elapsed', () => {
  render(<GlobalTimer {...baseProps} globalElapsed={60} />)
  expect(screen.getByText('14:00 remaining')).toBeInTheDocument()
})

it('shows overtime label when globalElapsed exceeds totalSeconds', () => {
  render(<GlobalTimer {...baseProps} globalElapsed={960} />)
  expect(screen.getByText('+1:00 overtime')).toBeInTheDocument()
})

it('renders one segment div per entry', () => {
  const segments = [
    { duration: 60, color: '#3b82f6' },
    { duration: 30, color: '#22c55e' },
  ]
  render(<GlobalTimer {...baseProps} globalElapsed={90} segments={segments} />)
  expect(screen.getAllByTestId('segment')).toHaveLength(2)
})

it('sets segment width proportional to totalSeconds', () => {
  const segments = [{ duration: 450, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={450} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.width).toBe('50%')
})

it('sets segment backgroundColor from color prop for speaker segments', () => {
  const segments = [{ duration: 60, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={60} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.backgroundColor).toBe('rgb(59, 130, 246)')
})

it('uses repeating-linear-gradient for idle segments (no color)', () => {
  const segments = [{ duration: 60 }]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={60} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.background).toContain('repeating-linear-gradient')
  expect(seg.style.backgroundColor).toBe('')
})

it('normalizes segment widths proportionally when in overtime', () => {
  const segments = [
    { duration: 600, color: '#3b82f6' },
    { duration: 600, color: '#22c55e' },
  ]
  const { container } = render(
    <GlobalTimer {...baseProps} globalElapsed={1200} segments={segments} />
  )
  const segs = container.querySelectorAll('[data-testid="segment"]') as NodeListOf<HTMLElement>
  expect(segs[0].style.width).toBe('50%')
  expect(segs[1].style.width).toBe('50%')
})

it('shows Start button when not running', () => {
  render(<GlobalTimer {...baseProps} globalRunning={false} />)
  expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
})

it('shows Pause button when running', () => {
  render(<GlobalTimer {...baseProps} globalRunning={true} />)
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
})

it('calls onStart when Start is clicked', async () => {
  const onStart = vi.fn()
  render(<GlobalTimer {...baseProps} onStart={onStart} />)
  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(onStart).toHaveBeenCalledTimes(1)
})

it('calls onPause when Pause is clicked', async () => {
  const onPause = vi.fn()
  render(<GlobalTimer {...baseProps} globalRunning={true} onPause={onPause} />)
  await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
  expect(onPause).toHaveBeenCalledTimes(1)
})

it('calls onReset when Reset is clicked', async () => {
  const onReset = vi.fn()
  render(<GlobalTimer {...baseProps} onReset={onReset} />)
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onReset).toHaveBeenCalledTimes(1)
})
