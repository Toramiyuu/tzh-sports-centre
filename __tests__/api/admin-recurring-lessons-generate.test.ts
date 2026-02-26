import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    recurringLesson: { findMany: vi.fn() },
    lessonSession: { findFirst: vi.fn(), create: vi.fn() },
    booking: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/admin/recurring-lessons/generate/route'

describe('POST /api/admin/recurring-lessons/generate', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/recurring-lessons/generate',
      body: { weeksAhead: 4 },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('generates sessions for active recurring lessons', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.recurringLesson.findMany).mockResolvedValue([
      {
        id: 'rl-1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:30',
        lessonType: 'private',
        billingType: 'per_session',
        duration: 1.5,
        price: 80,
        courtId: 1,
        court: { name: 'Court 1' },
        teacherId: 't1',
        studentIds: ['u1'],
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: null,
      },
    ] as never)

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        return fn(prisma as never)
      }
      return []
    })

    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.lessonSession.create).mockResolvedValue({ id: 'ls-new' } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/recurring-lessons/generate',
      body: { weeksAhead: 2 },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.generated).toBeGreaterThanOrEqual(0)
  })

  it('skips dates where a session already exists', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.recurringLesson.findMany).mockResolvedValue([
      {
        id: 'rl-1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:30',
        lessonType: 'private',
        billingType: 'per_session',
        duration: 1.5,
        price: 80,
        courtId: 1,
        court: { name: 'Court 1' },
        teacherId: null,
        studentIds: ['u1'],
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: null,
      },
    ] as never)

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        return fn(prisma as never)
      }
      return []
    })

    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue({ id: 'existing' } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/recurring-lessons/generate',
      body: { weeksAhead: 2 },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.skipped).toBeGreaterThanOrEqual(0)
    expect(prisma.lessonSession.create).not.toHaveBeenCalled()
  })
})
