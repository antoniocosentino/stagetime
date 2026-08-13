import { buildColorMap, buildRenderedSegments } from './segments'
import { COLORS } from '../constants/colors'

describe('buildColorMap', () => {
  it('assigns colors from the palette in name order', () => {
    expect(buildColorMap(['Alice', 'Bob'])).toEqual({
      Alice: COLORS[0],
      Bob: COLORS[1],
    })
  })

  it('wraps around the palette when there are more names than colors', () => {
    const names = Array.from({ length: COLORS.length + 1 }, (_, i) => `Speaker ${i}`)
    const colorMap = buildColorMap(names)
    expect(colorMap[`Speaker ${COLORS.length}`]).toBe(COLORS[0])
  })
})

describe('buildRenderedSegments', () => {
  const colorMap = { Alice: '#111', Bob: '#222' }
  const baseState = {
    segments: [],
    globalRunning: false,
    globalElapsed: 0,
    currentSpeaker: null,
    activeSegmentStart: null,
    idleSegmentStart: null,
  }

  it('maps a stored speaker segment to its color', () => {
    const rendered = buildRenderedSegments(
      { ...baseState, segments: [{ name: 'Alice', duration: 30, type: 'speaker' as const }] },
      colorMap
    )
    expect(rendered).toEqual([{ duration: 30, color: '#111' }])
  })

  it('maps a stored idle segment with no color', () => {
    const rendered = buildRenderedSegments(
      { ...baseState, segments: [{ name: '__idle__', duration: 15, type: 'idle' as const }] },
      colorMap
    )
    expect(rendered).toEqual([{ duration: 15 }])
  })

  it('falls back to gray for a speaker segment missing from the color map', () => {
    const rendered = buildRenderedSegments(
      { ...baseState, segments: [{ name: 'Unknown', duration: 10, type: 'speaker' as const }] },
      colorMap
    )
    expect(rendered).toEqual([{ duration: 10, color: '#6b7280' }])
  })

  it('appends the in-progress speaker segment while running', () => {
    const rendered = buildRenderedSegments(
      {
        ...baseState,
        globalRunning: true,
        globalElapsed: 50,
        currentSpeaker: 'Bob',
        activeSegmentStart: 20,
      },
      colorMap
    )
    expect(rendered).toEqual([{ duration: 30, color: '#222' }])
  })

  it('appends the in-progress idle segment while running', () => {
    const rendered = buildRenderedSegments(
      { ...baseState, globalRunning: true, globalElapsed: 50, idleSegmentStart: 40 },
      colorMap
    )
    expect(rendered).toEqual([{ duration: 10 }])
  })

  it('does not append an in-progress segment when paused', () => {
    const rendered = buildRenderedSegments(
      {
        ...baseState,
        globalRunning: false,
        globalElapsed: 50,
        currentSpeaker: 'Bob',
        activeSegmentStart: 20,
      },
      colorMap
    )
    expect(rendered).toEqual([])
  })

  it('does not append a zero-duration in-progress segment', () => {
    const rendered = buildRenderedSegments(
      {
        ...baseState,
        globalRunning: true,
        globalElapsed: 20,
        currentSpeaker: 'Bob',
        activeSegmentStart: 20,
      },
      colorMap
    )
    expect(rendered).toEqual([])
  })
})
