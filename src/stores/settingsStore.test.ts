import { useSettingsStore } from './settingsStore'

beforeEach(() => {
  localStorage.clear()
  useSettingsStore.setState({ names: ['test speaker'], timeLimitMinutes: 15 })
})

describe('settingsStore', () => {
  it('defaults to test speaker and 15 minutes', () => {
    const { names, timeLimitMinutes } = useSettingsStore.getState()
    expect(names).toEqual(['test speaker'])
    expect(timeLimitMinutes).toBe(15)
  })

  it('addName appends a name', () => {
    useSettingsStore.getState().addName('Alice')
    expect(useSettingsStore.getState().names).toEqual(['test speaker', 'Alice'])
  })

  it('removeName removes by value', () => {
    useSettingsStore.getState().addName('Alice')
    useSettingsStore.getState().removeName('test speaker')
    expect(useSettingsStore.getState().names).toEqual(['Alice'])
  })

  it('setNames replaces the full list', () => {
    useSettingsStore.getState().setNames(['Bob', 'Carol'])
    expect(useSettingsStore.getState().names).toEqual(['Bob', 'Carol'])
  })

  it('setTimeLimitMinutes updates the time limit', () => {
    useSettingsStore.getState().setTimeLimitMinutes(30)
    expect(useSettingsStore.getState().timeLimitMinutes).toBe(30)
  })
})
