import { formatDateOrdinal, formatFilenameTimestamp } from './date'

describe('formatDateOrdinal', () => {
  it('formats a date with weekday, ordinal day, month, and year', () => {
    expect(formatDateOrdinal(new Date(2026, 7, 13))).toBe('Thursday 13th August 2026')
  })
  it('uses "st" for day 1', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 1))).toBe('Thursday 1st January 2026')
  })
  it('uses "nd" for day 2', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 2))).toBe('Friday 2nd January 2026')
  })
  it('uses "rd" for day 3', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 3))).toBe('Saturday 3rd January 2026')
  })
  it('uses "th" for day 11 (not "11st")', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 11))).toBe('Sunday 11th January 2026')
  })
  it('uses "th" for day 12', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 12))).toBe('Monday 12th January 2026')
  })
  it('uses "th" for day 13', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 13))).toBe('Tuesday 13th January 2026')
  })
  it('uses "st" for day 21', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 21))).toBe('Wednesday 21st January 2026')
  })
  it('uses "st" for day 31', () => {
    expect(formatDateOrdinal(new Date(2026, 0, 31))).toBe('Saturday 31st January 2026')
  })
})

describe('formatFilenameTimestamp', () => {
  it('formats a date as a zero-padded, filename-safe timestamp', () => {
    expect(formatFilenameTimestamp(new Date(2026, 7, 13, 9, 5))).toBe('2026-08-13_0905')
  })
  it('pads single-digit month, day, hour, and minute', () => {
    expect(formatFilenameTimestamp(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01_0000')
  })
})
