import { render, screen } from '@testing-library/react'
import { Dice3D } from './Dice3D'

it('renders at the requested size', () => {
  render(<Dice3D size={140} />)
  const dice = screen.getByTestId('dice-3d')
  expect(dice.style.width).toBe('140px')
  expect(dice.style.height).toBe('140px')
})

it('renders six faces', () => {
  const { container } = render(<Dice3D size={20} />)
  expect(container.querySelectorAll('.rounded-\\[12\\%\\]')).toHaveLength(6)
})
