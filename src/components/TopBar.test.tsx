import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopBar } from './TopBar'

it('renders the app title', () => {
  render(<TopBar onOpenSettings={vi.fn()} />)
  expect(screen.getByText('stagetime')).toBeInTheDocument()
})

it('renders a settings button', () => {
  render(<TopBar onOpenSettings={vi.fn()} />)
  expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
})

it('calls onOpenSettings when the settings button is clicked', async () => {
  const onOpenSettings = vi.fn()
  render(<TopBar onOpenSettings={onOpenSettings} />)
  await userEvent.click(screen.getByRole('button', { name: /settings/i }))
  expect(onOpenSettings).toHaveBeenCalledTimes(1)
})
