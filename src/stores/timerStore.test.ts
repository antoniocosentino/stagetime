import { useTimerStore } from './timerStore'

beforeEach(() => {
  sessionStorage.clear()
  useTimerStore.setState({ speakers: {} })
})

describe('timerStore', () => {
  it('starts with no speakers', () => {
    expect(useTimerStore.getState().speakers).toEqual({})
  })

  it('addSpeaker creates entry with elapsed 0 and running false', () => {
    useTimerStore.getState().addSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toEqual({ elapsed: 0, running: false })
  })

  it('removeSpeaker deletes the entry', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().removeSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
  })

  it('startSpeaker sets running to true', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice'].running).toBe(true)
  })

  it('pauseSpeaker sets running to false', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().pauseSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice'].running).toBe(false)
  })

  it('resetSpeaker sets elapsed to 0 and running to false', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().tickRunning(5)
    useTimerStore.getState().resetSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toEqual({ elapsed: 0, running: false })
  })

  it('tickRunning increments elapsed only for running speakers', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().addSpeaker('Bob')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().tickRunning(0.1)
    const { speakers } = useTimerStore.getState()
    expect(speakers['Alice'].elapsed).toBeCloseTo(0.1)
    expect(speakers['Bob'].elapsed).toBe(0)
  })

  it('starting a speaker pauses any other running speaker', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().addSpeaker('Bob')
    useTimerStore.getState().startSpeaker('Alice')
    useTimerStore.getState().startSpeaker('Bob')
    const { speakers } = useTimerStore.getState()
    expect(speakers['Alice'].running).toBe(false)
    expect(speakers['Bob'].running).toBe(true)
  })

  it('tickRunning does not update paused speakers', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().tickRunning(1)
    expect(useTimerStore.getState().speakers['Alice'].elapsed).toBe(0)
  })
})
