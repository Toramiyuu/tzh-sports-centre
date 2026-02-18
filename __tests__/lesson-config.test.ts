import { describe, it, expect } from 'vitest'
import {
  getLessonType,
  getLessonPrice,
  getDefaultDuration,
  isMonthlyBilling,
  getDurationOptions,
  getPricePerPerson,
  hasPerPersonPricing,
  calculateProRatedPrice,
  calculateRemainingSessions,
  getMonthlyTrainingDates,
  isValidTrainingDate,
} from '@/lib/lesson-config'

describe('getLessonType', () => {
  it('returns lesson config for valid types', () => {
    const type = getLessonType('1-to-1')
    expect(type).toBeDefined()
    expect(type?.label).toBe('1-to-1 Private')
  })

  it('returns undefined for invalid types', () => {
    const type = getLessonType('invalid-type')
    expect(type).toBeUndefined()
  })
})

describe('getLessonPrice', () => {
  it('returns price for per-session lessons with specified duration', () => {
    expect(getLessonPrice('1-to-1', 1.5)).toBe(130)
    expect(getLessonPrice('1-to-1', 2)).toBe(160)
  })

  it('returns minimum price when duration not specified for per-session', () => {
    expect(getLessonPrice('1-to-1')).toBe(130)
  })

  it('returns monthly flat rate for monthly lessons', () => {
    expect(getLessonPrice('small-kids-beginners')).toBe(50)
    expect(getLessonPrice('large-kids')).toBe(100)
  })

  it('returns 0 for unknown lesson type', () => {
    expect(getLessonPrice('invalid')).toBe(0)
  })
})

describe('getDefaultDuration', () => {
  it('returns first allowed duration for per-session lessons', () => {
    expect(getDefaultDuration('1-to-1')).toBe(1.5)
    expect(getDefaultDuration('1-to-3')).toBe(2)
  })

  it('returns 2 for monthly lessons with no allowed durations', () => {
    expect(getDefaultDuration('small-kids-beginners')).toBe(2)
  })

  it('returns 2 for unknown lesson type', () => {
    expect(getDefaultDuration('invalid')).toBe(2)
  })
})

describe('isMonthlyBilling', () => {
  it('returns true for monthly billing lessons', () => {
    expect(isMonthlyBilling('small-kids-beginners')).toBe(true)
    expect(isMonthlyBilling('large-kids')).toBe(true)
  })

  it('returns false for per-session lessons', () => {
    expect(isMonthlyBilling('1-to-1')).toBe(false)
    expect(isMonthlyBilling('1-to-2')).toBe(false)
  })

  it('returns false for unknown lesson type', () => {
    expect(isMonthlyBilling('invalid')).toBe(false)
  })
})

describe('getDurationOptions', () => {
  it('returns duration options with prices for per-session lessons', () => {
    const options = getDurationOptions('1-to-1')
    expect(options).toHaveLength(2)
    expect(options[0]).toEqual({
      value: 1.5,
      label: '1.5 hours',
      price: 130,
      pricePerPerson: undefined,
    })
    expect(options[1]).toEqual({
      value: 2,
      label: '2 hours',
      price: 160,
      pricePerPerson: undefined,
    })
  })

  it('includes pricePerPerson for group lessons', () => {
    const options = getDurationOptions('1-to-2')
    expect(options[0].pricePerPerson).toBe(80)
    expect(options[1].pricePerPerson).toBe(90)
  })

  it('returns empty array for monthly lessons', () => {
    const options = getDurationOptions('small-kids-beginners')
    expect(options).toEqual([])
  })

  it('returns empty array for unknown lesson type', () => {
    const options = getDurationOptions('invalid')
    expect(options).toEqual([])
  })
})

describe('getPricePerPerson', () => {
  it('returns per-person price for group lessons with duration', () => {
    expect(getPricePerPerson('1-to-2', 1.5)).toBe(80)
    expect(getPricePerPerson('1-to-2', 2)).toBe(90)
  })

  it('returns minimum per-person price when duration not specified', () => {
    expect(getPricePerPerson('1-to-2')).toBe(80)
  })

  it('returns null for lessons without per-person pricing', () => {
    expect(getPricePerPerson('1-to-1')).toBeNull()
  })

  it('returns null for unknown lesson type', () => {
    expect(getPricePerPerson('invalid')).toBeNull()
  })
})

describe('hasPerPersonPricing', () => {
  it('returns true for group lessons with per-person pricing', () => {
    expect(hasPerPersonPricing('1-to-2')).toBe(true)
    expect(hasPerPersonPricing('1-to-3')).toBe(true)
  })

  it('returns false for lessons without per-person pricing', () => {
    expect(hasPerPersonPricing('1-to-1')).toBe(false)
  })

  it('returns false for unknown lesson type', () => {
    expect(hasPerPersonPricing('invalid')).toBe(false)
  })
})

describe('calculateProRatedPrice', () => {
  it('calculates pro-rated price for monthly lessons', () => {
    expect(calculateProRatedPrice('small-kids-beginners', 4)).toBe(50)
    expect(calculateProRatedPrice('small-kids-beginners', 2)).toBe(25)
    expect(calculateProRatedPrice('small-kids-beginners', 3)).toBe(38)
  })

  it('rounds to nearest integer', () => {
    expect(calculateProRatedPrice('large-kids-intermediate', 3)).toBe(105)
  })

  it('returns 0 for per-session lessons', () => {
    expect(calculateProRatedPrice('1-to-1', 2)).toBe(0)
  })

  it('returns 0 for unknown lesson type', () => {
    expect(calculateProRatedPrice('invalid', 2)).toBe(0)
  })
})

describe('calculateRemainingSessions', () => {
  it('counts remaining sessions in a month', () => {
    const feb3 = new Date(2026, 1, 3)
    expect(calculateRemainingSessions(1, feb3)).toBe(3)

    const feb10 = new Date(2026, 1, 10)
    expect(calculateRemainingSessions(1, feb10)).toBe(2)
  })

  it('skips 5th occurrence of a weekday', () => {
    const mar1 = new Date(2026, 2, 1)
    expect(calculateRemainingSessions(0, mar1)).toBe(4)
  })

  it('returns 0 when past all valid occurrences', () => {
    const feb28 = new Date(2026, 1, 28)
    expect(calculateRemainingSessions(1, feb28)).toBe(0)
  })
})

describe('getMonthlyTrainingDates', () => {
  it('returns first 4 occurrences of a weekday in a month', () => {
    const dates = getMonthlyTrainingDates(1, 2026, 1)
    expect(dates).toHaveLength(4)
    expect(dates[0].getDate()).toBe(2)
    expect(dates[1].getDate()).toBe(9)
    expect(dates[2].getDate()).toBe(16)
    expect(dates[3].getDate()).toBe(23)
  })

  it('returns only 4 dates even if 5 occurrences exist', () => {
    const dates = getMonthlyTrainingDates(0, 2026, 2)
    expect(dates).toHaveLength(4)
    expect(dates[3].getDate()).toBe(22)
  })
})

describe('isValidTrainingDate', () => {
  it('returns true for dates within first 4 occurrences', () => {
    expect(isValidTrainingDate(new Date(2026, 2, 1))).toBe(true)
    expect(isValidTrainingDate(new Date(2026, 2, 8))).toBe(true)
    expect(isValidTrainingDate(new Date(2026, 2, 15))).toBe(true)
    expect(isValidTrainingDate(new Date(2026, 2, 22))).toBe(true)
  })

  it('returns false for 5th occurrence', () => {
    expect(isValidTrainingDate(new Date(2026, 2, 29))).toBe(false)
  })

  it('handles multiple 5th occurrences correctly', () => {
    expect(isValidTrainingDate(new Date(2026, 0, 29))).toBe(false)
  })
})
