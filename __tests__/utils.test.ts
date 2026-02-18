import { describe, it, expect } from 'vitest'
import { formatUid } from '@/lib/utils'

describe('formatUid', () => {
  it('formats single-digit numbers with leading zeros', () => {
    expect(formatUid(1)).toBe('001')
    expect(formatUid(5)).toBe('005')
    expect(formatUid(9)).toBe('009')
  })

  it('formats two-digit numbers with one leading zero', () => {
    expect(formatUid(12)).toBe('012')
    expect(formatUid(50)).toBe('050')
    expect(formatUid(99)).toBe('099')
  })

  it('formats three-digit numbers without leading zeros', () => {
    expect(formatUid(123)).toBe('123')
    expect(formatUid(500)).toBe('500')
    expect(formatUid(999)).toBe('999')
  })

  it('handles numbers larger than 3 digits', () => {
    expect(formatUid(1234)).toBe('1234')
    expect(formatUid(10000)).toBe('10000')
  })

  it('handles bigint input', () => {
    expect(formatUid(BigInt(1))).toBe('001')
    expect(formatUid(BigInt(123))).toBe('123')
    expect(formatUid(BigInt(1234))).toBe('1234')
  })

  it('handles string input', () => {
    expect(formatUid('1')).toBe('001')
    expect(formatUid('12')).toBe('012')
    expect(formatUid('123')).toBe('123')
    expect(formatUid('1234')).toBe('1234')
  })

  it('handles zero', () => {
    expect(formatUid(0)).toBe('000')
    expect(formatUid(BigInt(0))).toBe('000')
    expect(formatUid('0')).toBe('000')
  })
})
