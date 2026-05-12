import { render, screen } from '@testing-library/react'
import { GlobalTimer } from './GlobalTimer'

it('shows remaining time label when no time has elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={0} segments={[]} />)
  expect(screen.getByText('15:00 remaining')).toBeInTheDocument()
})

it('counts down correctly based on elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={60} segments={[]} />)
  expect(screen.getByText('14:00 remaining')).toBeInTheDocument()
})

it('shows overtime label when total elapsed exceeds total seconds', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={960} segments={[]} />)
  expect(screen.getByText('+1:00 overtime')).toBeInTheDocument()
})

it('renders one segment div per entry', () => {
  const segments = [
    { name: 'Alice', duration: 60, color: '#3b82f6' },
    { name: 'Bob', duration: 30, color: '#22c55e' },
  ]
  render(<GlobalTimer totalSeconds={900} totalElapsed={90} segments={segments} />)
  expect(screen.getAllByTestId('segment')).toHaveLength(2)
})

it('sets segment width proportional to totalSeconds', () => {
  const segments = [{ name: 'Alice', duration: 450, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer totalSeconds={900} totalElapsed={450} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.width).toBe('50%')
})

it('sets segment background color from segment color', () => {
  const segments = [{ name: 'Alice', duration: 60, color: '#3b82f6' }]
  const { container } = render(
    <GlobalTimer totalSeconds={900} totalElapsed={60} segments={segments} />
  )
  const seg = container.querySelector('[data-testid="segment"]') as HTMLElement
  expect(seg.style.backgroundColor).toBe('rgb(59, 130, 246)')
})

it('normalizes segment widths proportionally when in overtime', () => {
  const segments = [
    { name: 'Alice', duration: 600, color: '#3b82f6' },
    { name: 'Bob', duration: 600, color: '#22c55e' },
  ]
  // totalElapsed 1200 > totalSeconds 900 (overtime)
  const { container } = render(
    <GlobalTimer totalSeconds={900} totalElapsed={1200} segments={segments} />
  )
  const segs = container.querySelectorAll('[data-testid="segment"]') as NodeListOf<HTMLElement>
  // Each segment is 600/1200 = 50% (not 600/900 = 66.7%)
  expect(segs[0].style.width).toBe('50%')
  expect(segs[1].style.width).toBe('50%')
})
