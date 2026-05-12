import { render } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

it('renders the progress fill element', () => {
  const { container } = render(<ProgressBar progress={0.5} />)
  expect(container.querySelector('[data-testid="progress-fill"]')).toBeInTheDocument()
})

it('sets width to percentage of progress', () => {
  const { container } = render(<ProgressBar progress={0.75} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.style.width).toBe('75%')
})

it('caps width at 150% in overtime', () => {
  const { container } = render(<ProgressBar progress={2} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.style.width).toBe('150%')
})

it('applies green color when progress is within time (≤1)', () => {
  const { container } = render(<ProgressBar progress={0.5} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.className).toContain('bg-green')
})

it('applies red color when progress exceeds 1 (overtime)', () => {
  const { container } = render(<ProgressBar progress={1.1} />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.className).toContain('bg-red')
})

it('uses provided color as inline style when color prop is given', () => {
  const { container } = render(<ProgressBar progress={0.5} color="#3b82f6" />)
  const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement
  expect(fill.style.backgroundColor).toBe('rgb(59, 130, 246)')
  expect(fill.className).not.toContain('bg-green')
  expect(fill.className).not.toContain('bg-red')
})
