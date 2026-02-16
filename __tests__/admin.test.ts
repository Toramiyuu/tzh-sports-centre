import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env before importing
beforeEach(() => {
  vi.stubEnv('ADMIN_EMAILS', 'admin@test.com,super@test.com')
})

describe('isAdmin', () => {
  it('returns true when dbIsAdmin is true', async () => {
    const { isAdmin } = await import('@/lib/admin')
    expect(isAdmin('random@email.com', true)).toBe(true)
  })

  it('returns true for emails in ADMIN_EMAILS env var', async () => {
    const { isAdmin } = await import('@/lib/admin')
    expect(isAdmin('admin@test.com')).toBe(true)
    expect(isAdmin('ADMIN@TEST.COM')).toBe(true)
  })

  it('returns false for non-admin emails without db flag', async () => {
    const { isAdmin } = await import('@/lib/admin')
    expect(isAdmin('nobody@test.com')).toBe(false)
    expect(isAdmin('nobody@test.com', false)).toBe(false)
  })

  it('returns false for null/undefined email without db flag', async () => {
    const { isAdmin } = await import('@/lib/admin')
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })
})

describe('isSuperAdmin', () => {
  it('returns true for emails in ADMIN_EMAILS env var', async () => {
    const { isSuperAdmin } = await import('@/lib/admin')
    expect(isSuperAdmin('super@test.com')).toBe(true)
  })

  it('returns false for non-listed emails', async () => {
    const { isSuperAdmin } = await import('@/lib/admin')
    expect(isSuperAdmin('random@test.com')).toBe(false)
    expect(isSuperAdmin(null)).toBe(false)
  })
})
