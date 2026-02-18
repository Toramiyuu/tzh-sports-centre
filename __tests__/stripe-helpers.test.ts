import { describe, it, expect } from 'vitest'
import { formatAmountForStripe, formatAmountFromStripe } from '@/lib/stripe'

describe('formatAmountForStripe', () => {
  it('converts whole ringgit amounts to sen', () => {
    expect(formatAmountForStripe(10)).toBe(1000)
    expect(formatAmountForStripe(100)).toBe(10000)
    expect(formatAmountForStripe(1)).toBe(100)
  })

  it('converts decimal ringgit amounts to sen', () => {
    expect(formatAmountForStripe(7.5)).toBe(750)
    expect(formatAmountForStripe(12.75)).toBe(1275)
    expect(formatAmountForStripe(0.5)).toBe(50)
  })

  it('rounds amounts correctly', () => {
    expect(formatAmountForStripe(10.555)).toBe(1056)
    expect(formatAmountForStripe(10.554)).toBe(1055)
    expect(formatAmountForStripe(10.5)).toBe(1050)
  })

  it('handles zero', () => {
    expect(formatAmountForStripe(0)).toBe(0)
  })
})

describe('formatAmountFromStripe', () => {
  it('converts sen to ringgit', () => {
    expect(formatAmountFromStripe(1000)).toBe(10)
    expect(formatAmountFromStripe(750)).toBe(7.5)
    expect(formatAmountFromStripe(10000)).toBe(100)
  })

  it('handles zero', () => {
    expect(formatAmountFromStripe(0)).toBe(0)
  })

  it('handles decimal sen amounts', () => {
    expect(formatAmountFromStripe(1055)).toBe(10.55)
    expect(formatAmountFromStripe(1)).toBe(0.01)
  })
})
