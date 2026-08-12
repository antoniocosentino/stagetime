import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'

const baseProps = {
  names: ['Alice', 'Bob'],
  timeLimitMinutes: 15,
  idleTimeMinutes: 1,
  squareModeEnabled: false,
  onAddName: vi.fn(),
  onRemoveName: vi.fn(),
  onChangeName: vi.fn(),
  onSetTimeLimit: vi.fn(),
  onSetIdleTime: vi.fn(),
  onToggleSquareMode: vi.fn(),
  onShuffle: vi.fn(),
  onClose: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.useRealTimers())

it('renders all speaker name inputs', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
})

it('renders the time limit input', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByDisplayValue('15')).toBeInTheDocument()
})

it('calls onClose when the close button is clicked (after animation)', () => {
  vi.useFakeTimers()
  const onClose = vi.fn()
  render(<SettingsPanel {...baseProps} onClose={onClose} />)
  fireEvent.click(screen.getByRole('button', { name: /close/i }))
  expect(onClose).not.toHaveBeenCalled()
  vi.runAllTimers()
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

it('calls onShuffle when shuffle button is clicked', async () => {
  const onShuffle = vi.fn()
  render(<SettingsPanel {...baseProps} onShuffle={onShuffle} />)
  await userEvent.click(screen.getByRole('button', { name: /shuffle order/i }))
  expect(onShuffle).toHaveBeenCalledTimes(1)
})

it('disables the shuffle button and keeps calling onShuffle while shuffling', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  render(<SettingsPanel {...baseProps} onShuffle={onShuffle} />)
  const button = screen.getByRole('button', { name: /shuffle order/i })

  fireEvent.click(button)
  expect(onShuffle).toHaveBeenCalledTimes(1)
  expect(button).toBeDisabled()

  act(() => {
    vi.advanceTimersByTime(1500)
  })
  expect(onShuffle.mock.calls.length).toBeGreaterThan(1)
  expect(button).toBeDisabled()
})

it('re-enables the shuffle button and stops shuffling after 3 seconds', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  render(<SettingsPanel {...baseProps} onShuffle={onShuffle} />)
  const button = screen.getByRole('button', { name: /shuffle order/i })

  fireEvent.click(button)
  act(() => {
    vi.advanceTimersByTime(3000)
  })
  expect(button).not.toBeDisabled()

  const callsAtStop = onShuffle.mock.calls.length
  act(() => {
    vi.advanceTimersByTime(1000)
  })
  expect(onShuffle.mock.calls.length).toBe(callsAtStop)
})

it('ignores additional clicks while already shuffling', () => {
  vi.useFakeTimers()
  const onShuffle = vi.fn()
  render(<SettingsPanel {...baseProps} onShuffle={onShuffle} />)
  const button = screen.getByRole('button', { name: /shuffle order/i })

  fireEvent.click(button)
  fireEvent.click(button)
  fireEvent.click(button)
  expect(onShuffle).toHaveBeenCalledTimes(1)
})

it('calls onAddName when Enter is pressed on the last speaker input', async () => {
  const onAddName = vi.fn()
  render(<SettingsPanel {...baseProps} onAddName={onAddName} />)
  const inputs = screen.getAllByRole('textbox').filter(
    (el) => ['Alice', 'Bob'].includes((el as HTMLInputElement).value)
  )
  await userEvent.type(inputs[inputs.length - 1], '{Enter}')
  expect(onAddName).toHaveBeenCalledTimes(1)
})

it('does not call onAddName when Enter is pressed on a non-last speaker input', async () => {
  const onAddName = vi.fn()
  render(<SettingsPanel {...baseProps} onAddName={onAddName} names={['Alice', 'Bob', 'Carol']} />)
  const inputs = screen.getAllByRole('textbox').filter(
    (el) => ['Alice', 'Bob', 'Carol'].includes((el as HTMLInputElement).value)
  )
  await userEvent.type(inputs[0], '{Enter}')
  expect(onAddName).not.toHaveBeenCalled()
})

it('calls onClose when clicking the backdrop (after animation)', () => {
  vi.useFakeTimers()
  const onClose = vi.fn()
  render(<SettingsPanel {...baseProps} onClose={onClose} />)
  fireEvent.click(document.querySelector('.bg-black\\/40')!)
  expect(onClose).not.toHaveBeenCalled()
  vi.runAllTimers()
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('does not call onClose when clicking inside the panel', async () => {
  const onClose = vi.fn()
  render(<SettingsPanel {...baseProps} onClose={onClose} />)
  await userEvent.click(screen.getByDisplayValue('Alice'))
  expect(onClose).not.toHaveBeenCalled()
})

it('reflects reshuffled names order when names prop changes', () => {
  const { rerender } = render(<SettingsPanel {...baseProps} names={['Alice', 'Bob', 'Carol']} />)
  rerender(<SettingsPanel {...baseProps} names={['Carol', 'Alice', 'Bob']} />)
  const inputs = screen.getAllByRole('textbox').filter(
    (el) => ['Alice', 'Bob', 'Carol'].includes((el as HTMLInputElement).value)
  )
  expect((inputs[0] as HTMLInputElement).value).toBe('Carol')
  expect((inputs[1] as HTMLInputElement).value).toBe('Alice')
  expect((inputs[2] as HTMLInputElement).value).toBe('Bob')
})

it('renders the idle time input with current value', () => {
  render(<SettingsPanel {...baseProps} idleTimeMinutes={2} />)
  expect(screen.getByDisplayValue('2')).toBeInTheDocument()
})

it('calls onSetIdleTime with numeric value on change', async () => {
  const onSetIdleTime = vi.fn()
  render(<SettingsPanel {...baseProps} onSetIdleTime={onSetIdleTime} />)
  const inputs = screen.getAllByRole('spinbutton')
  const idleInput = inputs[1]
  await userEvent.clear(idleInput)
  await userEvent.type(idleInput, '3')
  expect(onSetIdleTime).toHaveBeenLastCalledWith(3)
})

it('renders the square mode toggle in the off state', () => {
  render(<SettingsPanel {...baseProps} />)
  expect(screen.getByRole('switch', { name: /square mode/i })).toHaveAttribute('aria-checked', 'false')
})

it('renders the square mode toggle in the on state', () => {
  render(<SettingsPanel {...baseProps} squareModeEnabled={true} />)
  expect(screen.getByRole('switch', { name: /square mode/i })).toHaveAttribute('aria-checked', 'true')
})

it('calls onToggleSquareMode when the toggle is clicked', async () => {
  const onToggleSquareMode = vi.fn()
  render(<SettingsPanel {...baseProps} onToggleSquareMode={onToggleSquareMode} />)
  await userEvent.click(screen.getByRole('switch', { name: /square mode/i }))
  expect(onToggleSquareMode).toHaveBeenCalledTimes(1)
})
