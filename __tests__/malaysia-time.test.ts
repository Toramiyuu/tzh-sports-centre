import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getMalaysiaTime,
  getMalaysiaTimeString,
  getMalaysiaDateString,
  isTodayInMalaysia,
  isSlotTimePast,
  isSlotPast,
} from '@/lib/malaysia-time'

describe('Malaysia Time Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getMalaysiaTime', () => {
    it('returns a valid Date object', () => {
      const malaysiaTime = getMalaysiaTime()
      expect(malaysiaTime).toBeInstanceOf(Date)
      expect(malaysiaTime.getTime()).toBeGreaterThan(0)
    })
  })

  describe('getMalaysiaTimeString', () => {
    it('returns time in HH:mm format', () => {
      const timeStr = getMalaysiaTimeString()
      expect(timeStr).toMatch(/^\d{2}:\d{2}$/)
    })

    it('pads single digits with zeros', () => {
      vi.setSystemTime(new Date('2026-02-17T01:05:00Z'))
      const timeStr = getMalaysiaTimeString()
      expect(timeStr).toBe('09:05')
    })
  })

  describe('getMalaysiaDateString', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const dateStr = getMalaysiaDateString()
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('pads month and day with zeros', () => {
      vi.setSystemTime(new Date('2026-02-04T20:00:00Z'))
      const dateStr = getMalaysiaDateString()
      expect(dateStr).toBe('2026-02-05')
    })
  })

  describe('isTodayInMalaysia', () => {
    it('returns true for today\'s date', () => {
      vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
      const todayStr = getMalaysiaDateString()
      expect(isTodayInMalaysia(todayStr)).toBe(true)
    })

    it('returns false for past dates', () => {
      vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
      expect(isTodayInMalaysia('2026-02-16')).toBe(false)
    })

    it('returns false for future dates', () => {
      vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
      expect(isTodayInMalaysia('2026-02-18')).toBe(false)
    })
  })

  describe('isSlotTimePast', () => {
    it('returns true when current time is after slot time', () => {
      vi.setSystemTime(new Date('2026-02-17T10:30:00Z'))
      expect(isSlotTimePast('18:00')).toBe(true)
      expect(isSlotTimePast('17:00')).toBe(true)
    })

    it('returns false when current time is before slot time', () => {
      vi.setSystemTime(new Date('2026-02-17T10:30:00Z'))
      expect(isSlotTimePast('19:00')).toBe(false)
      expect(isSlotTimePast('20:30')).toBe(false)
    })

    it('returns false when current time equals slot time', () => {
      vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
      expect(isSlotTimePast('18:00')).toBe(false)
    })
  })

  describe('isSlotPast', () => {
    it('returns true when date is today and time has passed', () => {
      vi.setSystemTime(new Date('2026-02-17T10:30:00Z'))
      const today = getMalaysiaDateString()
      expect(isSlotPast(today, '18:00')).toBe(true)
      expect(isSlotPast(today, '17:00')).toBe(true)
    })

    it('returns false when date is today but time has not passed', () => {
      vi.setSystemTime(new Date('2026-02-17T10:30:00Z'))
      const today = getMalaysiaDateString()
      expect(isSlotPast(today, '19:00')).toBe(false)
      expect(isSlotPast(today, '20:00')).toBe(false)
    })

    it('returns false for future dates regardless of time', () => {
      vi.setSystemTime(new Date('2026-02-17T10:30:00Z'))
      expect(isSlotPast('2026-02-18', '10:00')).toBe(false)
      expect(isSlotPast('2026-02-20', '00:00')).toBe(false)
    })

    it('returns false for past dates (not today)', () => {
      vi.setSystemTime(new Date('2026-02-17T10:30:00Z'))
      expect(isSlotPast('2026-02-16', '18:00')).toBe(false)
    })
  })
})
