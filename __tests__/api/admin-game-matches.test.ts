import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gameSession: { findUnique: vi.fn() },
    sessionAttendance: { findMany: vi.fn() },
    match: { findMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('@/lib/gamification', () => ({
  recalculateMonthlyPoints: vi.fn(),
  updatePlayerGroup: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { recalculateMonthlyPoints, updatePlayerGroup } from '@/lib/gamification'
import { POST, GET } from '@/app/api/admin/game-sessions/[id]/matches/route'

const params = Promise.resolve({ id: 's1' })

describe('POST /api/admin/game-sessions/[id]/matches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
      body: { team1: ['u1', 'u2'], team2: ['u3', 'u4'], team1Score: 21, team2Score: 15 },
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(401)
  })

  it('returns 400 if scores are equal', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue({ id: 's1', date: new Date('2026-02-15') } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
      body: { team1: ['u1', 'u2'], team2: ['u3', 'u4'], team1Score: 21, team2Score: 21 },
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('equal')
  })

  it('returns 400 if not exactly 2 players per team', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue({ id: 's1', date: new Date() } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
      body: { team1: ['u1'], team2: ['u3', 'u4'], team1Score: 21, team2Score: 15 },
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(400)
  })

  it('returns 400 if players lack attendance', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue({ id: 's1', date: new Date() } as never)
    vi.mocked(prisma.sessionAttendance.findMany).mockResolvedValue([
      { userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' },
    ] as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
      body: { team1: ['u1', 'u2'], team2: ['u3', 'u4'], team1Score: 21, team2Score: 15 },
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('attendance')
  })

  it('creates match with correct winner and triggers points+group update', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue({ id: 's1', date: new Date('2026-02-15') } as never)
    vi.mocked(prisma.sessionAttendance.findMany).mockResolvedValue([
      { userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }, { userId: 'u4' },
    ] as never)

    const mockMatch = { id: 'm1', matchNumber: 1 }
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        match: { count: vi.fn().mockResolvedValue(0), create: vi.fn().mockResolvedValue(mockMatch) },
        matchPlayer: { createMany: vi.fn() },
      })
    })

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
      body: { team1: ['u1', 'u2'], team2: ['u3', 'u4'], team1Score: 21, team2Score: 15 },
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(201)

    expect(recalculateMonthlyPoints).toHaveBeenCalledTimes(4)
    expect(updatePlayerGroup).toHaveBeenCalledTimes(4)
    expect(recalculateMonthlyPoints).toHaveBeenCalledWith('u1', '2026-02', expect.anything())
  })

  it('rolls back match if points recalculation fails', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue({ id: 's1', date: new Date('2026-02-15') } as never)
    vi.mocked(prisma.sessionAttendance.findMany).mockResolvedValue([
      { userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }, { userId: 'u4' },
    ] as never)

    vi.mocked(recalculateMonthlyPoints).mockRejectedValue(new Error('Points calculation failed'))
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        match: { count: vi.fn().mockResolvedValue(0), create: vi.fn().mockResolvedValue({ id: 'm1', matchNumber: 1 }) },
        matchPlayer: { createMany: vi.fn() },
      })
    })

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
      body: { team1: ['u1', 'u2'], team2: ['u3', 'u4'], team1Score: 21, team2Score: 15 },
    })
    const res = await POST(req, { params })
    expect(res.status).toBe(500)
  })
})

describe('GET /api/admin/game-sessions/[id]/matches', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns matches with player details', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      { id: 'm1', matchNumber: 1, team1Score: 21, team2Score: 15, players: [] },
    ] as never)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/game-sessions/s1/matches',
    })
    const res = await GET(req, { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.matches).toHaveLength(1)
  })
})
