import { describe, it, expect } from 'vitest'
import { validateMonth, validateTeam, validatePlayerGroup } from '@/lib/validation'

describe('validateMonth', () => {
  it('returns valid YYYY-MM format', () => {
    expect(validateMonth('2026-02')).toBe('2026-02')
    expect(validateMonth('2025-12')).toBe('2025-12')
    expect(validateMonth('2026-01')).toBe('2026-01')
  })

  it('returns null for invalid formats', () => {
    expect(validateMonth('bad')).toBeNull()
    expect(validateMonth('2026-13')).toBeNull()
    expect(validateMonth('2026-00')).toBeNull()
    expect(validateMonth('202-02')).toBeNull()
    expect(validateMonth('2026-2')).toBeNull()
    expect(validateMonth('')).toBeNull()
    expect(validateMonth(null)).toBeNull()
    expect(validateMonth(undefined)).toBeNull()
  })
})

describe('validateTeam', () => {
  it('returns 1 or 2 for valid team numbers', () => {
    expect(validateTeam(1)).toBe(1)
    expect(validateTeam(2)).toBe(2)
  })

  it('returns null for invalid team numbers', () => {
    expect(validateTeam(0)).toBeNull()
    expect(validateTeam(3)).toBeNull()
    expect(validateTeam(-1)).toBeNull()
    expect(validateTeam(null)).toBeNull()
    expect(validateTeam(undefined)).toBeNull()
  })
})

describe('validatePlayerGroup', () => {
  it('returns valid player group values', () => {
    expect(validatePlayerGroup('ELITE')).toBe('ELITE')
    expect(validatePlayerGroup('ACTIVE')).toBe('ACTIVE')
  })

  it('returns null for invalid values', () => {
    expect(validatePlayerGroup('bad')).toBeNull()
    expect(validatePlayerGroup('elite')).toBeNull()
    expect(validatePlayerGroup('')).toBeNull()
    expect(validatePlayerGroup(null)).toBeNull()
    expect(validatePlayerGroup(undefined)).toBeNull()
  })
})
