import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gameSession: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    sessionAttendance: { createMany: vi.fn(), findMany: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/gamification', () => ({
  recalculateMonthlyPoints: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { recalculateMonthlyPoints } from '@/lib/gamification'
import { GET, POST } from '@/app/api/admin/game-sessions/route'

describe('GET /api/admin/game-sessions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/game-sessions' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated sessions with counts', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const mockSessions = [{ id: 's1', date: new Date(), _count: { attendances: 3, matches: 2 } }]
    vi.mocked(prisma.gameSession.findMany).mockResolvedValue(mockSessions as never)
    vi.mocked(prisma.gameSession.count).mockResolvedValue(1)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/game-sessions' })
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.sessions).toHaveLength(1)
    expect(json.total).toBe(1)
  })

  it('filters by month when provided', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findMany).mockResolvedValue([])
    vi.mocked(prisma.gameSession.count).mockResolvedValue(0)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/game-sessions',
      searchParams: { month: '2026-02' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.gameSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({ gte: expect.any(Date), lt: expect.any(Date) }),
        }),
      })
    )
  })
})

describe('POST /api/admin/game-sessions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 403 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions',
      body: { date: '2026-02-20' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('creates a game session and returns 201', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const mockSession = { id: 's1', date: new Date('2026-02-20'), createdBy: 'admin-user-id' }
    vi.mocked(prisma.gameSession.create).mockResolvedValue(mockSession as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions',
      body: { date: '2026-02-20' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.session.id).toBe('s1')
  })

  it('returns 400 for missing date', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions',
      body: {},
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/admin/game-sessions/[id]/attendance', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const { POST: POST_ATTENDANCE } = await import('@/app/api/admin/game-sessions/[id]/attendance/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/attendance',
      body: { userIds: ['u1'] },
    })
    const res = await POST_ATTENDANCE(req, { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(401)
  })

  it('records attendance and triggers points recalculation', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue({
      id: 's1', date: new Date('2026-02-15'),
    } as never)
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'u1' }, { id: 'u2' }] as never)
    vi.mocked(prisma.sessionAttendance.findMany).mockResolvedValue([])
    vi.mocked(prisma.sessionAttendance.createMany).mockResolvedValue({ count: 2 })

    const { POST: POST_ATTENDANCE } = await import('@/app/api/admin/game-sessions/[id]/attendance/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/attendance',
      body: { userIds: ['u1', 'u2'] },
    })
    const res = await POST_ATTENDANCE(req, { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(200)
    expect(recalculateMonthlyPoints).toHaveBeenCalledWith('u1', '2026-02', expect.anything())
    expect(recalculateMonthlyPoints).toHaveBeenCalledWith('u2', '2026-02', expect.anything())
  })
})
