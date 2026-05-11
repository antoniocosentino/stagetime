import { render, screen } from '@testing-library/react'
import { GlobalTimer } from './GlobalTimer'

it('shows remaining time label when no time has elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={0} />)
  expect(screen.getByText('15:00 remaining')).toBeInTheDocument()
})

it('counts down correctly based on elapsed', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={60} />)
  expect(screen.getByText('14:00 remaining')).toBeInTheDocument()
})

it('shows overtime label when total elapsed exceeds total seconds', () => {
  render(<GlobalTimer totalSeconds={900} totalElapsed={960} />)
  expect(screen.getByText('+1:00 overtime')).toBeInTheDocument()
})
