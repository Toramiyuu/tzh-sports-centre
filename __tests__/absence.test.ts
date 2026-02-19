import { describe, it, expect } from 'vitest'
import { classifyAbsence, getAbsenceStatus, createReplacementCreditExpiry } from '@/lib/absence'
import { validateAbsenceType } from '@/lib/validation'
import { AbsenceType, AbsenceStatus } from '@prisma/client'

function daysFromNow(appliedAt: Date, days: number): Date {
  const result = new Date(appliedAt)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

describe('classifyAbsence', () => {
  const base = new Date('2026-02-19T00:00:00.000Z')

  it('should return APPLY when lesson is exactly 7 days away', () => {
    expect(classifyAbsence(base, daysFromNow(base, 7))).toBe(AbsenceType.APPLY)
  })

  it('should return APPLY when lesson is more than 7 days away (30 days)', () => {
    expect(classifyAbsence(base, daysFromNow(base, 30))).toBe(AbsenceType.APPLY)
  })

  it('should return LATE_NOTICE when lesson is exactly 6 days away', () => {
    expect(classifyAbsence(base, daysFromNow(base, 6))).toBe(AbsenceType.LATE_NOTICE)
  })

  it('should return LATE_NOTICE when lesson is 4 days away', () => {
    expect(classifyAbsence(base, daysFromNow(base, 4))).toBe(AbsenceType.LATE_NOTICE)
  })

  it('should return LATE_NOTICE when lesson is exactly 3 days away', () => {
    expect(classifyAbsence(base, daysFromNow(base, 3))).toBe(AbsenceType.LATE_NOTICE)
  })

  it('should return ABSENT when lesson is exactly 2 days away', () => {
    expect(classifyAbsence(base, daysFromNow(base, 2))).toBe(AbsenceType.ABSENT)
  })

  it('should return ABSENT when lesson is tomorrow (1 day away)', () => {
    expect(classifyAbsence(base, daysFromNow(base, 1))).toBe(AbsenceType.ABSENT)
  })

  it('should return ABSENT when lesson is the same day (0 days away)', () => {
    expect(classifyAbsence(base, base)).toBe(AbsenceType.ABSENT)
  })

  it('should handle midnight MYT boundary correctly (11:59 PM MYT = different day in UTC)', () => {
    const appliedAt = new Date('2026-02-19T15:59:00.000Z')
    const lessonDate = new Date('2026-02-26T16:00:00.000Z')
    expect(classifyAbsence(appliedAt, lessonDate)).toBe(AbsenceType.APPLY)
  })

  it('should classify correctly near midnight MYT when UTC dates differ', () => {
    const appliedAt = new Date('2026-02-19T16:01:00.000Z')
    const lessonDate = new Date('2026-02-26T15:59:00.000Z')
    expect(classifyAbsence(appliedAt, lessonDate)).toBe(AbsenceType.LATE_NOTICE)
  })
})

describe('getAbsenceStatus', () => {
  it('should return APPROVED for APPLY type', () => {
    expect(getAbsenceStatus(AbsenceType.APPLY)).toBe(AbsenceStatus.APPROVED)
  })

  it('should return RECORDED for LATE_NOTICE type', () => {
    expect(getAbsenceStatus(AbsenceType.LATE_NOTICE)).toBe(AbsenceStatus.RECORDED)
  })

  it('should return RECORDED for ABSENT type', () => {
    expect(getAbsenceStatus(AbsenceType.ABSENT)).toBe(AbsenceStatus.RECORDED)
  })

  it('should return PENDING_REVIEW for MEDICAL type', () => {
    expect(getAbsenceStatus(AbsenceType.MEDICAL)).toBe(AbsenceStatus.PENDING_REVIEW)
  })
})

describe('createReplacementCreditExpiry', () => {
  it('should return a date 30 days from the given date', () => {
    const from = new Date('2026-02-19T08:00:00.000Z')
    const expiry = createReplacementCreditExpiry(from)
    const expected = new Date(from)
    expected.setDate(expected.getDate() + 30)
    expect(expiry.getTime()).toBe(expected.getTime())
  })

  it('should not mutate the input date', () => {
    const from = new Date('2026-02-19T08:00:00.000Z')
    const original = from.getTime()
    createReplacementCreditExpiry(from)
    expect(from.getTime()).toBe(original)
  })
})

describe('validateAbsenceType', () => {
  it('should return APPLY for "APPLY"', () => {
    expect(validateAbsenceType('APPLY')).toBe(AbsenceType.APPLY)
  })

  it('should return LATE_NOTICE for "LATE_NOTICE"', () => {
    expect(validateAbsenceType('LATE_NOTICE')).toBe(AbsenceType.LATE_NOTICE)
  })

  it('should return ABSENT for "ABSENT"', () => {
    expect(validateAbsenceType('ABSENT')).toBe(AbsenceType.ABSENT)
  })

  it('should return MEDICAL for "MEDICAL"', () => {
    expect(validateAbsenceType('MEDICAL')).toBe(AbsenceType.MEDICAL)
  })

  it('should return null for an unknown string', () => {
    expect(validateAbsenceType('UNKNOWN')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(validateAbsenceType('')).toBeNull()
  })

  it('should return null for lowercase input', () => {
    expect(validateAbsenceType('apply')).toBeNull()
  })

  it('should return null for undefined', () => {
    expect(validateAbsenceType(undefined as unknown as string)).toBeNull()
  })
})
