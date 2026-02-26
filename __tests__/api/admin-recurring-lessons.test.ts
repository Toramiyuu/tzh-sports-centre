import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    recurringLesson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lessonType: { findUnique: vi.fn() },
    court: { findUnique: vi.fn() },
    teacher: { findUnique: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { GET, POST, PATCH } from '@/app/api/admin/recurring-lessons/route'

describe('GET /api/admin/recurring-lessons', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/recurring-lessons' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns active recurring lessons', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.recurringLesson.findMany).mockResolvedValue([
      { id: 'rl-1', dayOfWeek: 1, startTime: '09:00', isActive: true },
    ] as never)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/recurring-lessons' })
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.recurringLessons).toHaveLength(1)
  })
})

describe('POST /api/admin/recurring-lessons', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 when required fields missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/recurring-lessons',
      body: { dayOfWeek: 1 },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('validates lesson type exists and is active', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue(null)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/recurring-lessons',
      body: {
        dayOfWeek: 1,
        startTime: '09:00',
        lessonType: 'nonexistent',
        duration: 1.5,
        courtId: 1,
        studentIds: ['u1'],
        startDate: '2026-03-01',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('lesson type')
  })

  it('creates recurring lesson successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue({
      id: 'lt-1', slug: 'private', name: 'Private', isActive: true,
      billingType: 'per_session', price: 80, maxStudents: 1,
      pricingTiers: [{ duration: 1.5, price: 80 }],
    } as never)
    vi.mocked(prisma.court.findUnique).mockResolvedValue({ id: 1, isActive: true } as never)
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'u1' }] as never)
    vi.mocked(prisma.recurringLesson.create).mockResolvedValue({
      id: 'rl-1', dayOfWeek: 1, startTime: '09:00', isActive: true,
    } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/recurring-lessons',
      body: {
        dayOfWeek: 1,
        startTime: '09:00',
        lessonType: 'private',
        duration: 1.5,
        courtId: 1,
        studentIds: ['u1'],
        startDate: '2026-03-01',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(prisma.recurringLesson.create).toHaveBeenCalled()
  })
})

describe('PATCH /api/admin/recurring-lessons', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 without id', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/recurring-lessons',
      body: { isActive: false },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it('deactivates a recurring lesson', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.recurringLesson.update).mockResolvedValue({
      id: 'rl-1', isActive: false,
    } as never)

    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/recurring-lessons',
      body: { id: 'rl-1', isActive: false },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(prisma.recurringLesson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rl-1' },
        data: expect.objectContaining({ isActive: false }),
      })
    )
  })
})
