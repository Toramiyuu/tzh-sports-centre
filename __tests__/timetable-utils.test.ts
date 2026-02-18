import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateTimeSlots,
  formatTimeDisplay,
  parseTime,
  timeToMinutes,
  isTimeInRange,
  getSlotStatus,
  getWeekDays,
  formatDateString,
  getStartOfWeek,
  addWeeks,
  formatWeekRange,
  isPastDate,
  calculateEndTime,
  slotStatusStyles,
  type DayAvailability,
  type SlotStatus,
} from '@/lib/timetable-utils'

describe('generateTimeSlots', () => {
  it('returns 31 slots from 9 AM to midnight', () => {
    const slots = generateTimeSlots()
    expect(slots).toHaveLength(31)
  })

  it('starts with 9:00 AM', () => {
    const slots = generateTimeSlots()
    expect(slots[0]).toEqual({
      time: '09:00',
      displayName: '9:00 AM',
    })
  })

  it('ends with midnight (12:00 AM)', () => {
    const slots = generateTimeSlots()
    const lastSlot = slots[slots.length - 1]
    expect(lastSlot).toEqual({
      time: '00:00',
      displayName: '12:00 AM',
    })
  })

  it('generates 30-minute intervals', () => {
    const slots = generateTimeSlots()
    expect(slots[1]).toEqual({
      time: '09:30',
      displayName: '9:30 AM',
    })
    expect(slots[2]).toEqual({
      time: '10:00',
      displayName: '10:00 AM',
    })
  })
})

describe('formatTimeDisplay', () => {
  it('formats morning hours correctly', () => {
    expect(formatTimeDisplay(9, 0)).toBe('9:00 AM')
    expect(formatTimeDisplay(11, 30)).toBe('11:30 AM')
  })

  it('formats noon correctly', () => {
    expect(formatTimeDisplay(12, 0)).toBe('12:00 PM')
    expect(formatTimeDisplay(12, 30)).toBe('12:30 PM')
  })

  it('formats afternoon/evening hours correctly', () => {
    expect(formatTimeDisplay(13, 0)).toBe('1:00 PM')
    expect(formatTimeDisplay(18, 30)).toBe('6:30 PM')
    expect(formatTimeDisplay(23, 0)).toBe('11:00 PM')
  })

  it('formats midnight correctly', () => {
    expect(formatTimeDisplay(0, 0)).toBe('12:00 AM')
  })

  it('pads minutes with zero', () => {
    expect(formatTimeDisplay(9, 5)).toBe('9:05 AM')
  })
})

describe('parseTime', () => {
  it('parses time string correctly', () => {
    expect(parseTime('09:00')).toEqual({ hour: 9, minute: 0 })
    expect(parseTime('14:30')).toEqual({ hour: 14, minute: 30 })
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 })
  })

  it('handles single-digit hours', () => {
    expect(parseTime('9:30')).toEqual({ hour: 9, minute: 30 })
  })
})

describe('timeToMinutes', () => {
  it('converts time to minutes since midnight', () => {
    expect(timeToMinutes('09:00')).toBe(540)
    expect(timeToMinutes('14:30')).toBe(870)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('treats midnight as end of day (1440 minutes)', () => {
    expect(timeToMinutes('00:00')).toBe(1440)
  })
})

describe('isTimeInRange', () => {
  it('returns true when time is within range', () => {
    expect(isTimeInRange('10:00', '09:00', '11:00')).toBe(true)
    expect(isTimeInRange('10:30', '10:00', '11:00')).toBe(true)
  })

  it('returns true when time equals start time', () => {
    expect(isTimeInRange('09:00', '09:00', '11:00')).toBe(true)
  })

  it('returns false when time equals end time (exclusive)', () => {
    expect(isTimeInRange('11:00', '09:00', '11:00')).toBe(false)
  })

  it('returns false when time is before range', () => {
    expect(isTimeInRange('08:30', '09:00', '11:00')).toBe(false)
  })

  it('returns false when time is after range', () => {
    expect(isTimeInRange('11:30', '09:00', '11:00')).toBe(false)
  })

  it('handles midnight end time correctly', () => {
    expect(isTimeInRange('23:30', '22:00', '00:00')).toBe(true)
    expect(isTimeInRange('00:00', '22:00', '00:00')).toBe(false)
  })
})

describe('getSlotStatus', () => {
  it('returns unavailable when dayData is undefined', () => {
    const result = getSlotStatus('10:00', undefined, false)
    expect(result).toEqual({ status: 'unavailable' })
  })

  it('returns unavailable for past dates', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [],
    }
    const result = getSlotStatus('10:00', dayData, true)
    expect(result).toEqual({ status: 'unavailable' })
  })

  it('returns available when coach is available and slot is free', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result).toEqual({ status: 'available' })
  })

  it('returns unavailable when coach is not available', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '14:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result).toEqual({ status: 'unavailable' })
  })

  it('returns booked when lesson is scheduled (not mine)', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [
        {
          id: 'lesson-1',
          startTime: '10:00',
          endTime: '11:00',
          lessonType: '1-to-1',
          status: 'confirmed',
          isMine: false,
        },
      ],
      pendingRequests: [],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result).toEqual({
      status: 'booked',
      lessonType: '1-to-1',
    })
  })

  it('returns my-lesson when lesson is mine', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [
        {
          id: 'lesson-1',
          startTime: '10:00',
          endTime: '11:00',
          lessonType: '1-to-1',
          status: 'confirmed',
          isMine: true,
        },
      ],
      pendingRequests: [],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result).toEqual({
      status: 'my-lesson',
      lessonType: '1-to-1',
      lessonId: 'lesson-1',
    })
  })

  it('returns my-pending for pending request', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [
        {
          id: 'request-1',
          requestedTime: '10:00',
          requestedDuration: 1,
          lessonType: '1-to-1',
        },
      ],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result).toEqual({
      status: 'my-pending',
      lessonType: '1-to-1',
      requestId: 'request-1',
    })
  })

  it('returns coach-suggested for coach-suggested time', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [],
      coachSuggestedRequests: [
        {
          id: 'request-1',
          originalDate: '2026-02-17',
          originalTime: '10:00',
          suggestedDate: '2026-02-18',
          suggestedTime: '14:00',
          requestedDuration: 1,
          lessonType: '1-to-1',
          adminNotes: 'Better time',
        },
      ],
    }
    const result = getSlotStatus('14:00', dayData, false)
    expect(result.status).toBe('coach-suggested')
    expect(result.lessonType).toBe('1-to-1')
    expect(result.requestId).toBe('request-1')
    expect(result.coachSuggestion).toBeDefined()
  })

  it('returns unavailable when all courts are booked', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [],
      fullyBookedSlots: ['10:00', '10:30'],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result).toEqual({ status: 'unavailable' })
  })

  it('prioritizes coach-suggested over pending requests', () => {
    const dayData: DayAvailability = {
      dayOfWeek: 1,
      coachAvailability: [{ startTime: '09:00', endTime: '17:00' }],
      scheduledLessons: [],
      pendingRequests: [
        {
          id: 'request-1',
          requestedTime: '10:00',
          requestedDuration: 1,
          lessonType: '1-to-1',
        },
      ],
      coachSuggestedRequests: [
        {
          id: 'request-2',
          originalDate: '2026-02-17',
          originalTime: '10:00',
          suggestedDate: '2026-02-17',
          suggestedTime: '10:00',
          requestedDuration: 1,
          lessonType: 'group',
          adminNotes: null,
        },
      ],
    }
    const result = getSlotStatus('10:00', dayData, false)
    expect(result.status).toBe('coach-suggested')
  })
})

describe('getWeekDays', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 7 days starting from given date', () => {
    const startDate = new Date('2026-02-16')
    const days = getWeekDays(startDate)
    expect(days).toHaveLength(7)
  })

  it('formats date strings correctly', () => {
    const startDate = new Date('2026-02-16')
    const days = getWeekDays(startDate)
    expect(days[0].dateString).toBe('2026-02-16')
    expect(days[6].dateString).toBe('2026-02-22')
  })

  it('includes correct day names', () => {
    const startDate = new Date('2026-02-16')
    const days = getWeekDays(startDate)
    expect(days[0].dayName).toBe('Monday')
    expect(days[0].dayShort).toBe('Mon')
    expect(days[6].dayName).toBe('Sunday')
    expect(days[6].dayShort).toBe('Sun')
  })

  it('marks today correctly', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
    const startDate = new Date('2026-02-16')
    const days = getWeekDays(startDate)
    expect(days[0].isToday).toBe(false)
    expect(days[1].isToday).toBe(true)
  })
})

describe('formatDateString', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDateString(new Date('2026-02-17'))).toBe('2026-02-17')
    expect(formatDateString(new Date('2026-12-31'))).toBe('2026-12-31')
  })

  it('pads month and day with zeros', () => {
    expect(formatDateString(new Date('2026-02-05'))).toBe('2026-02-05')
    expect(formatDateString(new Date('2026-01-01'))).toBe('2026-01-01')
  })
})

describe('getStartOfWeek', () => {
  it('returns Monday for dates in the middle of week', () => {
    const wednesday = new Date('2026-02-18')
    const startOfWeek = getStartOfWeek(wednesday)
    expect(formatDateString(startOfWeek)).toBe('2026-02-16')
  })

  it('returns same date if already Monday', () => {
    const monday = new Date('2026-02-16')
    const startOfWeek = getStartOfWeek(monday)
    expect(formatDateString(startOfWeek)).toBe('2026-02-16')
  })

  it('handles Sunday correctly (returns previous Monday)', () => {
    const sunday = new Date('2026-02-22')
    const startOfWeek = getStartOfWeek(sunday)
    expect(formatDateString(startOfWeek)).toBe('2026-02-16')
  })
})

describe('addWeeks', () => {
  it('adds weeks to date', () => {
    const date = new Date('2026-02-16')
    const nextWeek = addWeeks(date, 1)
    expect(formatDateString(nextWeek)).toBe('2026-02-23')
  })

  it('handles negative weeks (subtracts)', () => {
    const date = new Date('2026-02-16')
    const prevWeek = addWeeks(date, -1)
    expect(formatDateString(prevWeek)).toBe('2026-02-09')
  })

  it('handles multiple weeks', () => {
    const date = new Date('2026-02-16')
    const fourWeeksLater = addWeeks(date, 4)
    expect(formatDateString(fourWeeksLater)).toBe('2026-03-16')
  })
})

describe('formatWeekRange', () => {
  it('formats week range within same month', () => {
    const startDate = new Date('2026-02-16')
    expect(formatWeekRange(startDate)).toBe('Feb 16 - 22, 2026')
  })

  it('formats week range spanning two months', () => {
    const startDate = new Date('2026-02-23')
    expect(formatWeekRange(startDate)).toBe('Feb 23 - Mar 1, 2026')
  })

  it('formats week range at year boundary', () => {
    const startDate = new Date('2025-12-29')
    expect(formatWeekRange(startDate)).toBe('Dec 29 - Jan 4, 2026')
  })
})

describe('isPastDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for past dates', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
    expect(isPastDate(new Date('2026-02-16'))).toBe(true)
    expect(isPastDate(new Date('2026-01-01'))).toBe(true)
  })

  it('returns false for today', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
    expect(isPastDate(new Date('2026-02-17'))).toBe(false)
  })

  it('returns false for future dates', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))
    expect(isPastDate(new Date('2026-02-18'))).toBe(false)
    expect(isPastDate(new Date('2026-12-31'))).toBe(false)
  })

  it('ignores time component (compares dates only)', () => {
    vi.setSystemTime(new Date('2026-02-17T23:59:59'))
    expect(isPastDate(new Date('2026-02-17T00:00:00'))).toBe(false)
  })
})

describe('calculateEndTime', () => {
  it('calculates end time for 1-hour duration', () => {
    expect(calculateEndTime('10:00', 1)).toBe('11:00')
    expect(calculateEndTime('14:30', 1)).toBe('15:30')
  })

  it('calculates end time for multi-hour durations', () => {
    expect(calculateEndTime('10:00', 2)).toBe('12:00')
    expect(calculateEndTime('09:30', 3)).toBe('12:30')
  })

  it('calculates end time for fractional hours', () => {
    expect(calculateEndTime('10:00', 0.5)).toBe('10:30')
    expect(calculateEndTime('14:15', 1.5)).toBe('15:45')
  })

  it('wraps around midnight correctly', () => {
    expect(calculateEndTime('23:00', 2)).toBe('01:00')
    expect(calculateEndTime('23:30', 1)).toBe('00:30')
  })

  it('handles midnight start time', () => {
    expect(calculateEndTime('00:00', 1)).toBe('01:00')
  })
})

describe('slotStatusStyles', () => {
  it('contains styles for all status types', () => {
    const statuses: SlotStatus[] = [
      'available',
      'booked',
      'my-lesson',
      'my-pending',
      'coach-suggested',
      'unavailable',
    ]

    statuses.forEach(status => {
      expect(slotStatusStyles[status]).toBeDefined()
      expect(slotStatusStyles[status].bg).toBeDefined()
      expect(slotStatusStyles[status].border).toBeDefined()
      expect(slotStatusStyles[status].text).toBeDefined()
    })
  })

  it('has hover style only for available status', () => {
    expect(slotStatusStyles.available.hover).toBeDefined()
    expect(slotStatusStyles.booked.hover).toBeUndefined()
    expect(slotStatusStyles['my-lesson'].hover).toBeUndefined()
  })
})
