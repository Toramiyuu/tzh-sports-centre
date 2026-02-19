import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    playerPoints: { findMany: vi.fn() },
    playerProfile: { findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

describe('GET /api/admin/leaderboard/full', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const { GET } = await import('@/app/api/admin/leaderboard/full/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/leaderboard/full' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns leaderboard with ranks for requested month', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.playerPoints.findMany).mockResolvedValue([
      {
        userId: 'u1', month: '2026-02',
        attendancePoints: 3, gamesPoints: 2.5, winsPoints: 3, bonusPoints: 0, totalPoints: 8.5,
        user: { name: 'Alice' },
      },
      {
        userId: 'u2', month: '2026-02',
        attendancePoints: 2, gamesPoints: 1.5, winsPoints: 1, bonusPoints: 0, totalPoints: 4.5,
        user: { name: 'Bob' },
      },
    ] as never)

    const { GET } = await import('@/app/api/admin/leaderboard/full/route')
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/leaderboard/full',
      searchParams: { month: '2026-02' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.leaderboard).toHaveLength(2)
    expect(json.leaderboard[0].rank).toBe(1)
    expect(json.leaderboard[0].userId).toBe('u1')
    expect(json.leaderboard[1].rank).toBe(2)
  })

  it('defaults to current month when no param', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.playerPoints.findMany).mockResolvedValue([])

    const { GET } = await import('@/app/api/admin/leaderboard/full/route')
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/leaderboard/full',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.playerPoints.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ month: expect.stringMatching(/^\d{4}-\d{2}$/) }),
      })
    )
  })

  it('returns 400 for invalid month format', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const { GET } = await import('@/app/api/admin/leaderboard/full/route')
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/leaderboard/full',
      searchParams: { month: 'bad-month' },
    })
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/player-groups', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const { GET } = await import('@/app/api/admin/player-groups/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/player-groups' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns all player profiles with user names', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.playerProfile.findMany).mockResolvedValue([
      {
        userId: 'u1', group: 'ELITE', groupOverride: false,
        winRate: 0.75, totalGames: 12, totalWins: 9,
        user: { name: 'Alice' },
      },
    ] as never)

    const { GET } = await import('@/app/api/admin/player-groups/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/player-groups' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.players).toHaveLength(1)
    expect(json.players[0].group).toBe('ELITE')
    expect(json.players[0].user.name).toBe('Alice')
  })
})

describe('PATCH /api/admin/player-groups/[userId]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const { PATCH } = await import('@/app/api/admin/player-groups/[userId]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/player-groups/u1',
      body: { group: 'ELITE', override: true },
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'u1' }) })
    expect(res.status).toBe(401)
  })

  it('updates group and override flag', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.playerProfile.findUnique).mockResolvedValue({ userId: 'u1', group: 'ACTIVE' } as never)
    vi.mocked(prisma.playerProfile.update).mockResolvedValue({
      userId: 'u1', group: 'ELITE', groupOverride: true,
    } as never)

    const { PATCH } = await import('@/app/api/admin/player-groups/[userId]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/player-groups/u1',
      body: { group: 'ELITE', override: true },
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'u1' }) })
    expect(res.status).toBe(200)
    expect(prisma.playerProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        data: { group: 'ELITE', groupOverride: true },
      })
    )
  })

  it('returns 400 for invalid group value', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const { PATCH } = await import('@/app/api/admin/player-groups/[userId]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/player-groups/u1',
      body: { group: 'INVALID', override: true },
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'u1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent player profile', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.playerProfile.findUnique).mockResolvedValue(null)

    const { PATCH } = await import('@/app/api/admin/player-groups/[userId]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/player-groups/u1',
      body: { group: 'ELITE', override: true },
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'u1' }) })
    expect(res.status).toBe(404)
  })
})
