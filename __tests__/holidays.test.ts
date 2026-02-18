import { describe, it, expect } from 'vitest'
import {
  isPublicHoliday,
  getHolidayName,
  isSchoolHoliday,
  shouldUseWeekendHours,
} from '@/lib/holidays'

describe('isPublicHoliday', () => {
  it('returns true for known public holidays', () => {
    expect(isPublicHoliday(new Date('2026-01-01'))).toBe(true)
    expect(isPublicHoliday(new Date('2026-05-01'))).toBe(true)
    expect(isPublicHoliday(new Date('2026-08-31'))).toBe(true)
    expect(isPublicHoliday(new Date('2026-12-25'))).toBe(true)
  })

  it('returns false for normal working days', () => {
    expect(isPublicHoliday(new Date('2026-02-10'))).toBe(false)
    expect(isPublicHoliday(new Date('2026-06-15'))).toBe(false)
  })
})

describe('getHolidayName', () => {
  it('returns holiday name for public holidays', () => {
    expect(getHolidayName(new Date('2026-01-01'))).toBe("New Year's Day")
    expect(getHolidayName(new Date('2026-05-01'))).toBe('Labour Day')
    expect(getHolidayName(new Date('2026-12-25'))).toBe('Christmas Day')
  })

  it('returns null for non-holidays', () => {
    expect(getHolidayName(new Date('2026-02-10'))).toBeNull()
    expect(getHolidayName(new Date('2026-07-15'))).toBeNull()
  })
})

describe('isSchoolHoliday', () => {
  it('returns true for dates within school holiday periods', () => {
    expect(isSchoolHoliday(new Date('2026-05-23'))).toBe(true)
    expect(isSchoolHoliday(new Date('2026-05-30'))).toBe(true)
    expect(isSchoolHoliday(new Date('2026-06-07'))).toBe(true)
  })

  it('returns false for dates outside school holidays', () => {
    expect(isSchoolHoliday(new Date('2026-05-22'))).toBe(false)
    expect(isSchoolHoliday(new Date('2026-06-08'))).toBe(false)
    expect(isSchoolHoliday(new Date('2026-07-15'))).toBe(false)
  })
})

describe('shouldUseWeekendHours', () => {
  it('returns true for Saturdays', () => {
    expect(shouldUseWeekendHours(new Date('2026-02-07'))).toBe(true)
    expect(shouldUseWeekendHours(new Date('2026-02-14'))).toBe(true)
  })

  it('returns true for Sundays', () => {
    expect(shouldUseWeekendHours(new Date('2026-02-01'))).toBe(true)
    expect(shouldUseWeekendHours(new Date('2026-02-08'))).toBe(true)
  })

  it('returns false for weekdays that are not holidays', () => {
    expect(shouldUseWeekendHours(new Date('2026-02-02'))).toBe(false)
    expect(shouldUseWeekendHours(new Date('2026-02-03'))).toBe(false)
    expect(shouldUseWeekendHours(new Date('2026-02-04'))).toBe(false)
    expect(shouldUseWeekendHours(new Date('2026-02-05'))).toBe(false)
    expect(shouldUseWeekendHours(new Date('2026-02-06'))).toBe(false)
  })

  it('returns true for public holidays even on weekdays', () => {
    expect(shouldUseWeekendHours(new Date('2026-05-01'))).toBe(true)
  })
})
