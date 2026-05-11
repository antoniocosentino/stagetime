import { formatSeconds, timePerSpeaker } from './time'

describe('formatSeconds', () => {
  it('formats zero', () => {
    expect(formatSeconds(0)).toBe('0:00')
  })
  it('formats 65 seconds as 1:05', () => {
    expect(formatSeconds(65)).toBe('1:05')
  })
  it('formats 300 seconds as 5:00', () => {
    expect(formatSeconds(300)).toBe('5:00')
  })
  it('formats negative seconds (overtime -30s)', () => {
    expect(formatSeconds(-30)).toBe('-0:30')
  })
  it('formats negative minutes (overtime -90s)', () => {
    expect(formatSeconds(-90)).toBe('-1:30')
  })
})

describe('timePerSpeaker', () => {
  it('divides 15 minutes evenly among 3 speakers', () => {
    expect(timePerSpeaker(15, 3)).toBe(300)
  })
  it('returns full duration for a single speaker', () => {
    expect(timePerSpeaker(10, 1)).toBe(600)
  })
})
