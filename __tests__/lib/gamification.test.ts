import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recalculateMonthlyPoints, updatePlayerGroup } from '@/lib/gamification'

function createMockTx() {
  return {
    sessionAttendance: {
      count: vi.fn(),
    },
    matchPlayer: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    playerPoints: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    playerProfile: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    gameSession: {
      findMany: vi.fn(),
    },
  }
}

describe('recalculateMonthlyPoints', () => {
  let tx: ReturnType<typeof createMockTx>

  beforeEach(() => {
    tx = createMockTx()
  })

  it('calculates points correctly for a month with attendance, games, and wins', async () => {
    tx.sessionAttendance.count.mockResolvedValue(3)
    tx.matchPlayer.findMany.mockResolvedValue([
      { isWinner: true },
      { isWinner: true },
      { isWinner: false },
      { isWinner: true },
      { isWinner: false },
    ])
    tx.playerPoints.findUnique.mockResolvedValue(null)

    await recalculateMonthlyPoints('user-1', '2026-02', tx as never)

    expect(tx.playerPoints.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_month: { userId: 'user-1', month: '2026-02' } },
        update: expect.objectContaining({
          attendancePoints: 3.0,
          gamesPoints: 5.0,
          winsPoints: 3.0,
          bonusPoints: 0,
          totalPoints: 11.0,
        }),
        create: expect.objectContaining({
          userId: 'user-1',
          month: '2026-02',
          attendancePoints: 3.0,
          gamesPoints: 5.0,
          winsPoints: 3.0,
          bonusPoints: 0,
          totalPoints: 11.0,
        }),
      })
    )
  })

  it('handles zero activity month', async () => {
    tx.sessionAttendance.count.mockResolvedValue(0)
    tx.matchPlayer.findMany.mockResolvedValue([])
    tx.playerPoints.findUnique.mockResolvedValue(null)

    await recalculateMonthlyPoints('user-1', '2026-01', tx as never)

    expect(tx.playerPoints.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          attendancePoints: 0,
          gamesPoints: 0,
          winsPoints: 0,
          totalPoints: 0,
        }),
      })
    )
  })
})

describe('updatePlayerGroup', () => {
  let tx: ReturnType<typeof createMockTx>

  beforeEach(() => {
    tx = createMockTx()
  })

  it('sets ELITE when win rate >= 60% and >= 8 games in last 10 sessions', async () => {
    tx.gameSession.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: `session-${i}` }))
    )
    tx.matchPlayer.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        isWinner: i < 7,
        match: { sessionId: `session-${i}` },
      }))
    )

    await updatePlayerGroup('user-1', tx as never)

    expect(tx.playerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          group: 'ELITE',
          winRate: 0.7,
          totalGames: 10,
          totalWins: 7,
        }),
      })
    )
  })

  it('stays ACTIVE when win rate < 60%', async () => {
    tx.gameSession.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: `session-${i}` }))
    )
    tx.matchPlayer.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        isWinner: i < 4,
        match: { sessionId: `session-${i}` },
      }))
    )

    await updatePlayerGroup('user-1', tx as never)

    expect(tx.playerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          group: 'ACTIVE',
          winRate: 0.4,
          totalGames: 10,
          totalWins: 4,
        }),
      })
    )
  })

  it('stays ACTIVE when fewer than 8 games regardless of win rate', async () => {
    tx.gameSession.findMany.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ id: `session-${i}` }))
    )
    tx.matchPlayer.findMany.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        isWinner: true,
        match: { sessionId: `session-${i}` },
      }))
    )

    await updatePlayerGroup('user-1', tx as never)

    expect(tx.playerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          group: 'ACTIVE',
          totalGames: 5,
          totalWins: 5,
        }),
      })
    )
  })

  it('skips group update but still writes stats when groupOverride is true', async () => {
    tx.gameSession.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: `session-${i}` }))
    )
    tx.matchPlayer.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        isWinner: i < 8,
        match: { sessionId: `session-${i}` },
      }))
    )
    tx.playerProfile.findUnique.mockResolvedValue({
      groupOverride: true,
    })

    await updatePlayerGroup('user-1', tx as never)

    const call = tx.playerProfile.upsert.mock.calls[0][0]
    expect(call.update.winRate).toBe(0.8)
    expect(call.update.totalGames).toBe(10)
    expect(call.update.totalWins).toBe(8)
    expect(call.update.group).toBeUndefined()
  })

  it('creates PlayerProfile with ACTIVE defaults for new player', async () => {
    tx.gameSession.findMany.mockResolvedValue([])
    tx.matchPlayer.findMany.mockResolvedValue([])

    await updatePlayerGroup('user-new', tx as never)

    expect(tx.playerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-new' },
        create: expect.objectContaining({
          userId: 'user-new',
          group: 'ACTIVE',
          groupOverride: false,
        }),
      })
    )
  })
})
