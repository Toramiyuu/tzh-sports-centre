import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  const config = { maxRequests: 3, windowMs: 1000 }

  beforeEach(() => {
    // Use unique keys per test to avoid state leakage
  })

  it('allows requests within the limit', () => {
    const key = `test-${Date.now()}-allow`
    const r1 = checkRateLimit(key, config)
    const r2 = checkRateLimit(key, config)
    const r3 = checkRateLimit(key, config)

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    expect(r3.success).toBe(true)
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests over the limit', () => {
    const key = `test-${Date.now()}-block`
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const r4 = checkRateLimit(key, config)

    expect(r4.success).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('uses separate counters per key', () => {
    const key1 = `test-${Date.now()}-key1`
    const key2 = `test-${Date.now()}-key2`

    checkRateLimit(key1, config)
    checkRateLimit(key1, config)
    checkRateLimit(key1, config)

    const r = checkRateLimit(key2, config)
    expect(r.success).toBe(true)
    expect(r.remaining).toBe(2)
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '1.2.3.4, 5.6.7.8')
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('extracts IP from x-real-ip', () => {
    const headers = new Headers()
    headers.set('x-real-ip', '10.0.0.1')
    expect(getClientIp(headers)).toBe('10.0.0.1')
  })

  it('falls back to unknown', () => {
    const headers = new Headers()
    expect(getClientIp(headers)).toBe('unknown')
  })
})
