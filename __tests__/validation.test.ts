import { describe, it, expect } from 'vitest'
import {
  validateMalaysianPhone,
  validateEmail,
  validateSport,
  validateFutureDate,
  validateTension,
  validatePaymentMethod,
} from '@/lib/validation'

describe('validateMalaysianPhone', () => {
  it('accepts valid Malaysian mobile numbers', () => {
    expect(validateMalaysianPhone('0123456789')).toBe('0123456789')
    expect(validateMalaysianPhone('01234567890')).toBe('01234567890')
    expect(validateMalaysianPhone('+60123456789')).toBe('+60123456789')
    expect(validateMalaysianPhone('60123456789')).toBe('60123456789')
  })

  it('strips spaces and dashes', () => {
    expect(validateMalaysianPhone('012-345 6789')).toBe('0123456789')
    expect(validateMalaysianPhone('012 3456 789')).toBe('0123456789')
  })

  it('rejects invalid numbers', () => {
    expect(validateMalaysianPhone('12345')).toBeNull()
    expect(validateMalaysianPhone('abc')).toBeNull()
    expect(validateMalaysianPhone('')).toBeNull()
    expect(validateMalaysianPhone(null)).toBeNull()
    expect(validateMalaysianPhone(undefined)).toBeNull()
  })
})

describe('validateEmail', () => {
  it('accepts valid emails and lowercases', () => {
    expect(validateEmail('test@example.com')).toBe('test@example.com')
    expect(validateEmail('Test@Example.COM')).toBe('test@example.com')
    expect(validateEmail('  user@domain.co  ')).toBe('user@domain.co')
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('not-an-email')).toBeNull()
    expect(validateEmail('@missing.com')).toBeNull()
    expect(validateEmail('user@')).toBeNull()
    expect(validateEmail('')).toBeNull()
    expect(validateEmail(null)).toBeNull()
  })
})

describe('validateSport', () => {
  it('accepts valid sports', () => {
    expect(validateSport('badminton')).toBe('badminton')
    expect(validateSport('pickleball')).toBe('pickleball')
    expect(validateSport('BADMINTON')).toBe('badminton')
    expect(validateSport(' Pickleball ')).toBe('pickleball')
  })

  it('rejects invalid sports', () => {
    expect(validateSport('tennis')).toBeNull()
    expect(validateSport('')).toBeNull()
    expect(validateSport(null)).toBeNull()
  })
})

describe('validateFutureDate', () => {
  it('accepts today when allowToday is true', () => {
    const today = new Date()
    expect(validateFutureDate(today.toISOString())).not.toBeNull()
  })

  it('rejects yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(validateFutureDate(yesterday.toISOString())).toBeNull()
  })

  it('accepts future dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(validateFutureDate(future.toISOString())).not.toBeNull()
  })

  it('rejects invalid inputs', () => {
    expect(validateFutureDate('not-a-date')).toBeNull()
    expect(validateFutureDate('')).toBeNull()
    expect(validateFutureDate(null)).toBeNull()
  })
})

describe('validateTension', () => {
  it('accepts valid tension range (18-35)', () => {
    expect(validateTension(18)).toBe(18)
    expect(validateTension(25)).toBe(25)
    expect(validateTension(35)).toBe(35)
  })

  it('rejects out-of-range values', () => {
    expect(validateTension(17)).toBeNull()
    expect(validateTension(36)).toBeNull()
    expect(validateTension(0)).toBeNull()
  })

  it('rejects invalid inputs', () => {
    expect(validateTension(null)).toBeNull()
    expect(validateTension(undefined)).toBeNull()
  })
})

describe('validatePaymentMethod', () => {
  it('accepts valid payment methods', () => {
    expect(validatePaymentMethod('tng')).toBe('tng')
    expect(validatePaymentMethod('duitnow')).toBe('duitnow')
    expect(validatePaymentMethod('TNG')).toBe('tng')
  })

  it('rejects invalid methods', () => {
    expect(validatePaymentMethod('visa')).toBeNull()
    expect(validatePaymentMethod('')).toBeNull()
    expect(validatePaymentMethod(null)).toBeNull()
  })
})
