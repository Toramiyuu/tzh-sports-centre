import { describe, it, expect } from 'vitest'
import {
  calculateHours,
  calculateBookingAmount,
  getSportRate,
  getSlotRate,
  countSessionsInMonth,
  groupRecurringSlots,
  getPaymentStatus,
  BADMINTON_RATE,
  BADMINTON_PEAK_RATE,
  PICKLEBALL_RATE,
} from '@/lib/recurring-booking-utils'

describe('calculateHours', () => {
  it('calculates hours for normal time range', () => {
    expect(calculateHours('09:00', '10:00')).toBe(1)
    expect(calculateHours('09:00', '10:30')).toBe(1.5)
    expect(calculateHours('14:00', '16:00')).toBe(2)
  })

  it('calculates hours for 30-minute slots', () => {
    expect(calculateHours('09:00', '09:30')).toBe(0.5)
    expect(calculateHours('17:30', '18:00')).toBe(0.5)
  })

  it('handles midnight crossover', () => {
    expect(calculateHours('21:00', '00:00')).toBe(3)
    expect(calculateHours('23:00', '01:00')).toBe(2)
  })
})

describe('calculateBookingAmount', () => {
  it('calculates off-peak badminton rate (before 6PM)', () => {
    // 1 hour at RM15/hr
    expect(calculateBookingAmount('09:00', '10:00', 'badminton')).toBe(BADMINTON_RATE)
    // 2 hours at RM15/hr
    expect(calculateBookingAmount('14:00', '16:00', 'badminton')).toBe(BADMINTON_RATE * 2)
  })

  it('calculates peak badminton rate (6PM onwards)', () => {
    // 1 hour at RM18/hr
    expect(calculateBookingAmount('18:00', '19:00', 'badminton')).toBe(BADMINTON_PEAK_RATE)
    // 2 hours at RM18/hr
    expect(calculateBookingAmount('19:00', '21:00', 'badminton')).toBe(BADMINTON_PEAK_RATE * 2)
  })

  it('calculates mixed peak/off-peak badminton (crosses 6PM)', () => {
    // 17:00-19:00: 1hr off-peak (RM15) + 1hr peak (RM18) = RM33
    expect(calculateBookingAmount('17:00', '19:00', 'badminton')).toBe(BADMINTON_RATE + BADMINTON_PEAK_RATE)
  })

  it('calculates flat pickleball rate', () => {
    expect(calculateBookingAmount('09:00', '11:00', 'pickleball')).toBe(PICKLEBALL_RATE * 2)
    expect(calculateBookingAmount('19:00', '21:00', 'pickleball')).toBe(PICKLEBALL_RATE * 2)
  })

  it('is case-insensitive for sport', () => {
    expect(calculateBookingAmount('09:00', '10:00', 'Pickleball')).toBe(PICKLEBALL_RATE)
    expect(calculateBookingAmount('09:00', '10:00', 'PICKLEBALL')).toBe(PICKLEBALL_RATE)
  })
})

describe('getSlotRate', () => {
  it('returns correct badminton off-peak rate per 30min', () => {
    expect(getSlotRate('badminton', '09:00')).toBe(7.5)
    expect(getSlotRate('badminton', '17:30')).toBe(7.5)
  })

  it('returns correct badminton peak rate per 30min', () => {
    expect(getSlotRate('badminton', '18:00')).toBe(9)
    expect(getSlotRate('badminton', '20:30')).toBe(9)
  })

  it('returns correct pickleball rate per 30min', () => {
    expect(getSlotRate('pickleball', '09:00')).toBe(12.5)
    expect(getSlotRate('pickleball', '18:00')).toBe(12.5)
    expect(getSlotRate('pickleball', '21:00')).toBe(12.5)
  })
})

describe('getSportRate', () => {
  it('returns pickleball flat rate', () => {
    expect(getSportRate('pickleball')).toBe(PICKLEBALL_RATE)
    expect(getSportRate('pickleball', '18:00')).toBe(PICKLEBALL_RATE)
  })

  it('returns badminton off-peak rate', () => {
    expect(getSportRate('badminton')).toBe(BADMINTON_RATE)
    expect(getSportRate('badminton', '17:00')).toBe(BADMINTON_RATE)
  })

  it('returns badminton peak rate after 6PM', () => {
    expect(getSportRate('badminton', '18:00')).toBe(BADMINTON_PEAK_RATE)
    expect(getSportRate('badminton', '20:00')).toBe(BADMINTON_PEAK_RATE)
  })
})

describe('countSessionsInMonth', () => {
  it('counts Mondays in February 2026', () => {
    // Feb 2026: starts on Sunday. Mondays: 2, 9, 16, 23 = 4
    expect(countSessionsInMonth(2026, 2, 1)).toBe(4)
  })

  it('counts Sundays in March 2026', () => {
    // March 2026: starts on Sunday. Sundays: 1, 8, 15, 22, 29 = 5
    expect(countSessionsInMonth(2026, 3, 0)).toBe(5)
  })

  it('counts Saturdays in January 2026', () => {
    // Jan 2026: starts on Thursday. Saturdays: 3, 10, 17, 24, 31 = 5
    expect(countSessionsInMonth(2026, 1, 6)).toBe(5)
  })
})

describe('getPaymentStatus', () => {
  it('returns paid when status is paid', () => {
    expect(getPaymentStatus('paid', 1, 2026)).toBe('paid')
  })

  it('returns overdue for past months with pending status', () => {
    // January 2026 is past (current is Feb 2026)
    expect(getPaymentStatus('pending', 1, 2026)).toBe('overdue')
  })

  it('returns unpaid for current/future months with pending status', () => {
    // Current month should be unpaid, not overdue
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    expect(getPaymentStatus('pending', currentMonth, currentYear)).toBe('unpaid')
  })

  it('returns overdue for past years', () => {
    expect(getPaymentStatus('pending', 12, 2025)).toBe('overdue')
  })
})

describe('groupRecurringSlots', () => {
  const makeSlot = (overrides: Partial<{
    id: string
    courtId: number
    sport: string
    dayOfWeek: number
    startTime: string
    endTime: string
    userId: string | null
    guestName: string | null
    guestPhone: string | null
    hourlyRate: number | null
    isActive: boolean
    label: string | null
    startDate: Date
    endDate: Date | null
    court: { id: number; name: string; hourlyRate: number }
  }>) => ({
    id: 'slot-1',
    courtId: 1,
    sport: 'badminton',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '09:30',
    startDate: new Date('2026-01-01'),
    endDate: null,
    label: null,
    userId: 'user-1',
    guestName: null,
    guestPhone: null,
    hourlyRate: null,
    isActive: true,
    court: { id: 1, name: 'Court 1', hourlyRate: 15 },
    ...overrides,
  })

  it('groups contiguous slots into a single booking', () => {
    const slots = [
      makeSlot({ id: 's1', startTime: '09:00', endTime: '09:30' }),
      makeSlot({ id: 's2', startTime: '09:30', endTime: '10:00' }),
    ]
    const groups = groupRecurringSlots(slots as any)
    expect(groups).toHaveLength(1)
    expect(groups[0].startTime).toBe('09:00')
    expect(groups[0].endTime).toBe('10:00')
    expect(groups[0].slotIds).toEqual(['s1', 's2'])
    expect(groups[0].duration).toBe(1)
  })

  it('splits non-contiguous slots into separate bookings', () => {
    const slots = [
      makeSlot({ id: 's1', startTime: '09:00', endTime: '09:30' }),
      makeSlot({ id: 's2', startTime: '10:00', endTime: '10:30' }),
    ]
    const groups = groupRecurringSlots(slots as any)
    expect(groups).toHaveLength(2)
  })

  it('splits slots from different users', () => {
    const slots = [
      makeSlot({ id: 's1', userId: 'user-1', startTime: '09:00', endTime: '09:30' }),
      makeSlot({ id: 's2', userId: 'user-2', startTime: '09:30', endTime: '10:00' }),
    ]
    const groups = groupRecurringSlots(slots as any)
    expect(groups).toHaveLength(2)
  })

  it('splits slots from different courts', () => {
    const slots = [
      makeSlot({ id: 's1', courtId: 1, startTime: '09:00', endTime: '09:30', court: { id: 1, name: 'Court 1', hourlyRate: 15 } }),
      makeSlot({ id: 's2', courtId: 2, startTime: '09:30', endTime: '10:00', court: { id: 2, name: 'Court 2', hourlyRate: 15 } }),
    ]
    const groups = groupRecurringSlots(slots as any)
    expect(groups).toHaveLength(2)
  })

  it('uses custom hourly rate when set', () => {
    const slots = [
      makeSlot({ id: 's1', hourlyRate: 20, startTime: '09:00', endTime: '09:30' }),
      makeSlot({ id: 's2', hourlyRate: 20, startTime: '09:30', endTime: '10:00' }),
    ]
    const groups = groupRecurringSlots(slots as any)
    expect(groups[0].amountPerSession).toBe(20) // 1 hour * RM20
  })
})
