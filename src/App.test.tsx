import { render } from '@testing-library/react'
import { act } from 'react'
import App from './App'
import { useSettingsStore } from './stores/settingsStore'
import { useTimerStore } from './stores/timerStore'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useSettingsStore.setState({ names: ['Alice'], timeLimitMinutes: 15, idleTimeMinutes: 1 })
  useTimerStore.setState({
    speakers: {},
    globalRunning: false,
    globalElapsed: 0,
    currentSpeaker: null,
    idleElapsed: 0,
    segments: [],
    activeSegmentStart: null,
    idleSegmentStart: null,
    lastTickTime: null,
  })
})

it('creates a timer entry for each name on mount', () => {
  render(<App />)
  expect(useTimerStore.getState().speakers['Alice']).toBeDefined()
})

it('adds a timer entry when a new name is added to settings', () => {
  render(<App />)
  act(() => {
    useSettingsStore.getState().addName('Bob')
  })
  expect(useTimerStore.getState().speakers['Bob']).toBeDefined()
})

it('removes the timer entry when a name is removed from settings', () => {
  useTimerStore.setState({ speakers: { Alice: { elapsed: 10 } } })
  render(<App />)
  act(() => {
    useSettingsStore.getState().removeName('Alice')
  })
  expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
})
