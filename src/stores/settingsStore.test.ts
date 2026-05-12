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

  it('shuffleNames returns the same names in any order', () => {
    useSettingsStore.setState({ names: ['Alice', 'Bob', 'Carol'], timeLimitMinutes: 15 })
    useSettingsStore.getState().shuffleNames()
    const { names } = useSettingsStore.getState()
    expect(names).toHaveLength(3)
    expect(names).toEqual(expect.arrayContaining(['Alice', 'Bob', 'Carol']))
  })

  it('shuffleNames actually reorders the array', () => {
    useSettingsStore.setState({ names: ['Alice', 'Bob', 'Carol'], timeLimitMinutes: 15 })
    let call = 0
    vi.spyOn(Math, 'random').mockImplementation(() => [0.9, 0.1, 0.5][call++ % 3])
    useSettingsStore.getState().shuffleNames()
    vi.restoreAllMocks()
    expect(useSettingsStore.getState().names).not.toEqual(['Alice', 'Bob', 'Carol'])
  })
})
