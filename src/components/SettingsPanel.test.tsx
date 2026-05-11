import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'

const baseProps = {
  names: ['Alice', 'Bob'],
  timeLimitMinutes: 15,
  onAddName: vi.fn(),
  onRemoveName: vi.fn(),
  onChangeName: vi.fn(),
  onSetTimeLimit: vi.fn(),
  onClose: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

it('renders all speaker name inputs', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
})

it('renders the time limit input', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByDisplayValue('15')).toBeInTheDocument()
})

it('calls onClose when the close button is clicked', async () => {
  const onClose = vi.fn()
  render(<SettingsPanel {...baseProps} onClose={onClose} />)
  await userEvent.click(screen.getByRole('button', { name: /close/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('calls onAddName when Add speaker is clicked', async () => {
  const onAddName = vi.fn()
  render(<SettingsPanel {...baseProps} onAddName={onAddName} />)
  await userEvent.click(screen.getByRole('button', { name: /add speaker/i }))
  expect(onAddName).toHaveBeenCalledTimes(1)
})

it('calls onRemoveName with the correct name when delete is clicked', async () => {
  const onRemoveName = vi.fn()
  render(<SettingsPanel {...baseProps} onRemoveName={onRemoveName} />)
  const deleteButtons = screen.getAllByRole('button', { name: /remove/i })
  await userEvent.click(deleteButtons[0])
  expect(onRemoveName).toHaveBeenCalledWith('Alice')
})

it('calls onChangeName with old and new name on blur', async () => {
  const onChangeName = vi.fn()
  render(<SettingsPanel {...baseProps} onChangeName={onChangeName} />)
  const input = screen.getByDisplayValue('Alice')
  await userEvent.clear(input)
  await userEvent.type(input, 'Carol')
  fireEvent.blur(input)
  expect(onChangeName).toHaveBeenLastCalledWith('Alice', 'Carol')
})

it('calls onSetTimeLimit with numeric value on change', async () => {
  const onSetTimeLimit = vi.fn()
  render(<SettingsPanel {...baseProps} onSetTimeLimit={onSetTimeLimit} />)
  const input = screen.getByDisplayValue('15')
  await userEvent.clear(input)
  await userEvent.type(input, '20')
  expect(onSetTimeLimit).toHaveBeenLastCalledWith(20)
})
