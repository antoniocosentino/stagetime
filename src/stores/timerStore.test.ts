import { useTimerStore } from './timerStore'

const RESET_STATE = {
  speakers: {},
  globalRunning: false,
  globalElapsed: 0,
  currentSpeaker: null as string | null,
  idleElapsed: 0,
  segments: [] as never[],
  activeSegmentStart: null as number | null,
  idleSegmentStart: null as number | null,
  lastTickTime: null as number | null,
}

beforeEach(() => {
  sessionStorage.clear()
  useTimerStore.setState(RESET_STATE)
})

describe('timerStore', () => {
  it('starts with no speakers and timer not running', () => {
    const s = useTimerStore.getState()
    expect(s.speakers).toEqual({})
    expect(s.globalRunning).toBe(false)
    expect(s.globalElapsed).toBe(0)
  })

  it('addSpeaker creates entry with elapsed 0', () => {
    useTimerStore.getState().addSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toEqual({ elapsed: 0 })
  })

  it('removeSpeaker deletes the entry and its committed segments', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      segments: [{ name: 'Alice', duration: 5, type: 'speaker' }],
    })
    useTimerStore.getState().removeSpeaker('Alice')
    expect(useTimerStore.getState().speakers['Alice']).toBeUndefined()
    expect(useTimerStore.getState().segments).toHaveLength(0)
  })

  it('removeSpeaker clears currentSpeaker and resets to idle when timer is running', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      currentSpeaker: 'Alice',
      globalRunning: true,
      globalElapsed: 5,
      activeSegmentStart: 0,
    })
    useTimerStore.getState().removeSpeaker('Alice')
    const s = useTimerStore.getState()
    expect(s.currentSpeaker).toBeNull()
    expect(s.activeSegmentStart).toBeNull()
    expect(s.idleSegmentStart).toBe(5)
  })

  it('startGlobal sets globalRunning to true', () => {
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().globalRunning).toBe(true)
  })

  it('startGlobal sets idleSegmentStart when no currentSpeaker', () => {
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().idleSegmentStart).toBe(0)
  })

  it('startGlobal sets activeSegmentStart when currentSpeaker is set', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({ currentSpeaker: 'Alice', globalElapsed: 10 })
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().activeSegmentStart).toBe(10)
  })

  it('startGlobal is a no-op when already running', () => {
    useTimerStore.setState({ globalRunning: true, globalElapsed: 5 })
    useTimerStore.getState().startGlobal()
    expect(useTimerStore.getState().globalElapsed).toBe(5)
  })

  it('pauseGlobal sets globalRunning to false and commits idle segment', () => {
    useTimerStore.setState({
      globalRunning: true,
      globalElapsed: 10,
      idleSegmentStart: 0,
      currentSpeaker: null,
    })
    useTimerStore.getState().pauseGlobal()
    const s = useTimerStore.getState()
    expect(s.globalRunning).toBe(false)
    expect(s.segments).toHaveLength(1)
    expect(s.segments[0]).toEqual({ name: '__idle__', duration: 10, type: 'idle' })
    expect(s.idleSegmentStart).toBeNull()
  })

  it('pauseGlobal commits speaker segment when currentSpeaker is set', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalRunning: true,
      globalElapsed: 8,
      currentSpeaker: 'Alice',
      activeSegmentStart: 5,
    })
    useTimerStore.getState().pauseGlobal()
    const s = useTimerStore.getState()
    expect(s.segments[0]).toEqual({ name: 'Alice', duration: 3, type: 'speaker' })
    expect(s.activeSegmentStart).toBeNull()
  })

  it('pauseGlobal is a no-op when already paused', () => {
    useTimerStore.setState({ globalRunning: false, segments: [] })
    useTimerStore.getState().pauseGlobal()
    expect(useTimerStore.getState().segments).toHaveLength(0)
  })

  it('resetAll zeroes everything and preserves speaker keys', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalElapsed: 100,
      idleElapsed: 20,
      globalRunning: true,
      currentSpeaker: 'Alice',
      segments: [{ name: 'Alice', duration: 10, type: 'speaker' }],
      speakers: { Alice: { elapsed: 10 } },
    })
    useTimerStore.getState().resetAll()
    const s = useTimerStore.getState()
    expect(s.globalElapsed).toBe(0)
    expect(s.idleElapsed).toBe(0)
    expect(s.globalRunning).toBe(false)
    expect(s.currentSpeaker).toBeNull()
    expect(s.segments).toHaveLength(0)
    expect(s.speakers['Alice']).toEqual({ elapsed: 0 })
  })

  it('setCurrentSpeaker commits idle segment and opens speaker segment', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({ globalElapsed: 10, idleSegmentStart: 0 })
    useTimerStore.getState().setCurrentSpeaker('Alice')
    const s = useTimerStore.getState()
    expect(s.segments).toHaveLength(1)
    expect(s.segments[0]).toEqual({ name: '__idle__', duration: 10, type: 'idle' })
    expect(s.currentSpeaker).toBe('Alice')
    expect(s.activeSegmentStart).toBe(10)
    expect(s.idleSegmentStart).toBeNull()
  })

  it('setCurrentSpeaker(null) commits speaker segment and opens idle segment', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      currentSpeaker: 'Alice',
      globalElapsed: 15,
      activeSegmentStart: 10,
    })
    useTimerStore.getState().setCurrentSpeaker(null)
    const s = useTimerStore.getState()
    expect(s.segments).toHaveLength(1)
    expect(s.segments[0]).toEqual({ name: 'Alice', duration: 5, type: 'speaker' })
    expect(s.currentSpeaker).toBeNull()
    expect(s.idleSegmentStart).toBe(15)
    expect(s.activeSegmentStart).toBeNull()
  })

  it('setCurrentSpeaker switching speakers commits previous and opens new', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.getState().addSpeaker('Bob')
    useTimerStore.setState({
      currentSpeaker: 'Alice',
      globalElapsed: 8,
      activeSegmentStart: 5,
    })
    useTimerStore.getState().setCurrentSpeaker('Bob')
    const s = useTimerStore.getState()
    expect(s.segments[0]).toEqual({ name: 'Alice', duration: 3, type: 'speaker' })
    expect(s.currentSpeaker).toBe('Bob')
    expect(s.activeSegmentStart).toBe(8)
  })

  it('tick sets lastTickTime when it was null and does not advance elapsed', () => {
    useTimerStore.getState().tick()
    const s = useTimerStore.getState()
    expect(s.lastTickTime).not.toBeNull()
    expect(s.globalElapsed).toBe(0)
  })

  it('tick does not advance elapsed when globalRunning is false', () => {
    useTimerStore.setState({ lastTickTime: Date.now() - 1000, globalRunning: false })
    useTimerStore.getState().tick()
    expect(useTimerStore.getState().globalElapsed).toBe(0)
  })

  it('tick advances globalElapsed and idleElapsed when running with no speaker', () => {
    useTimerStore.setState({ globalRunning: true, lastTickTime: Date.now() - 500 })
    useTimerStore.getState().tick()
    const s = useTimerStore.getState()
    expect(s.globalElapsed).toBeCloseTo(0.5, 1)
    expect(s.idleElapsed).toBeCloseTo(0.5, 1)
  })

  it('tick advances speaker elapsed when currentSpeaker is set', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalRunning: true,
      currentSpeaker: 'Alice',
      lastTickTime: Date.now() - 200,
    })
    useTimerStore.getState().tick()
    const s = useTimerStore.getState()
    expect(s.globalElapsed).toBeCloseTo(0.2, 1)
    expect(s.speakers['Alice'].elapsed).toBeCloseTo(0.2, 1)
    expect(s.idleElapsed).toBe(0)
  })

  it('tick does not mutate idleElapsed when a speaker is active', () => {
    useTimerStore.getState().addSpeaker('Alice')
    useTimerStore.setState({
      globalRunning: true,
      currentSpeaker: 'Alice',
      idleElapsed: 5,
      lastTickTime: Date.now() - 100,
    })
    useTimerStore.getState().tick()
    expect(useTimerStore.getState().idleElapsed).toBeCloseTo(5, 1)
  })
})
