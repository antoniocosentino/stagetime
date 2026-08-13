import { formatRecapTimeText, computeLegendLayout } from './recap'

describe('formatRecapTimeText', () => {
  it('reports used and allocated time as a slash-separated pair when within the limit', () => {
    expect(formatRecapTimeText(300, 900)).toBe('5:00/15:00')
  })
  it('reports used and allocated time exactly at the limit with no overtime', () => {
    expect(formatRecapTimeText(900, 900)).toBe('15:00/15:00')
  })
  it('appends overtime when used exceeds allocated', () => {
    expect(formatRecapTimeText(945, 900)).toBe('15:45/15:00 (+0:45 overtime)')
  })
})

describe('computeLegendLayout', () => {
  const entries = [
    { name: 'Alice', color: '#111', seconds: 30 },
    { name: 'Bob', color: '#222', seconds: 45 },
    { name: 'Carol', color: '#333', seconds: 12 },
  ]

  it('shows every entry when they all fit within maxVisible', () => {
    expect(computeLegendLayout(entries, 5)).toEqual({ shown: entries, moreCount: 0 })
  })

  it('shows every entry when the count exactly matches maxVisible', () => {
    expect(computeLegendLayout(entries, 3)).toEqual({ shown: entries, moreCount: 0 })
  })

  it('truncates and reports the remaining count when there are too many entries', () => {
    expect(computeLegendLayout(entries, 2)).toEqual({
      shown: [entries[0]],
      moreCount: 2,
    })
  })
})
