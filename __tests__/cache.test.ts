import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCachedTimeSlots,
  getCachedCourts,
  invalidateCache,
} from '@/lib/cache'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    timeSlot: {
      findMany: vi.fn(),
    },
    court: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('getCachedTimeSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    invalidateCache()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches time slots from database on cache miss', async () => {
    const mockTimeSlots = [
      { id: '1', slotTime: '09:00', createdAt: new Date() },
      { id: '2', slotTime: '10:00', createdAt: new Date() },
    ]
    vi.mocked(prisma.timeSlot.findMany).mockResolvedValue(mockTimeSlots as never)

    const result = await getCachedTimeSlots()

    expect(result).toEqual(mockTimeSlots)
    expect(prisma.timeSlot.findMany).toHaveBeenCalledTimes(1)
  })

  it('returns cached time slots on cache hit', async () => {
    const mockTimeSlots = [
      { id: '1', slotTime: '09:00', createdAt: new Date() },
    ]
    vi.mocked(prisma.timeSlot.findMany).mockResolvedValue(mockTimeSlots as never)

    await getCachedTimeSlots()

    const result = await getCachedTimeSlots()

    expect(result).toEqual(mockTimeSlots)
    expect(prisma.timeSlot.findMany).toHaveBeenCalledTimes(1)
  })

  it('refetches after cache expires (10 minutes)', async () => {
    const mockTimeSlots1 = [{ id: '1', slotTime: '09:00', createdAt: new Date() }]
    const mockTimeSlots2 = [{ id: '2', slotTime: '10:00', createdAt: new Date() }]

    vi.mocked(prisma.timeSlot.findMany)
      .mockResolvedValueOnce(mockTimeSlots1 as never)
      .mockResolvedValueOnce(mockTimeSlots2 as never)

    const result1 = await getCachedTimeSlots()
    expect(result1).toEqual(mockTimeSlots1)

    vi.advanceTimersByTime(11 * 60 * 1000)

    const result2 = await getCachedTimeSlots()
    expect(result2).toEqual(mockTimeSlots2)
    expect(prisma.timeSlot.findMany).toHaveBeenCalledTimes(2)
  })

  it('invalidates specific cache key', async () => {
    const mockTimeSlots = [{ id: '1', slotTime: '09:00', createdAt: new Date() }]
    vi.mocked(prisma.timeSlot.findMany).mockResolvedValue(mockTimeSlots as never)

    await getCachedTimeSlots()

    invalidateCache('timeSlots')

    await getCachedTimeSlots()

    expect(prisma.timeSlot.findMany).toHaveBeenCalledTimes(2)
  })
})

describe('getCachedCourts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    invalidateCache()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches courts from database on cache miss', async () => {
    const mockCourts = [
      { id: 1, name: 'Court 1', isActive: true, createdAt: new Date() },
      { id: 2, name: 'Court 2', isActive: true, createdAt: new Date() },
    ]
    vi.mocked(prisma.court.findMany).mockResolvedValue(mockCourts as never)

    const result = await getCachedCourts()

    expect(result).toEqual(mockCourts)
    expect(prisma.court.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  })

  it('returns cached courts on cache hit', async () => {
    const mockCourts = [
      { id: 1, name: 'Court 1', isActive: true, createdAt: new Date() },
    ]
    vi.mocked(prisma.court.findMany).mockResolvedValue(mockCourts as never)

    await getCachedCourts()

    const result = await getCachedCourts()

    expect(result).toEqual(mockCourts)
    expect(prisma.court.findMany).toHaveBeenCalledTimes(1)
  })

  it('refetches after cache expires', async () => {
    const mockCourts1 = [{ id: 1, name: 'Court 1', isActive: true, createdAt: new Date() }]
    const mockCourts2 = [{ id: 2, name: 'Court 2', isActive: true, createdAt: new Date() }]

    vi.mocked(prisma.court.findMany)
      .mockResolvedValueOnce(mockCourts1 as never)
      .mockResolvedValueOnce(mockCourts2 as never)

    await getCachedCourts()

    vi.advanceTimersByTime(11 * 60 * 1000)

    const result = await getCachedCourts()
    expect(result).toEqual(mockCourts2)
    expect(prisma.court.findMany).toHaveBeenCalledTimes(2)
  })
})

describe('invalidateCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateCache()
  })

  it('clears entire cache when no key provided', async () => {
    const mockTimeSlots = [{ id: '1', slotTime: '09:00', createdAt: new Date() }]
    const mockCourts = [{ id: 1, name: 'Court 1', isActive: true, createdAt: new Date() }]

    vi.mocked(prisma.timeSlot.findMany).mockResolvedValue(mockTimeSlots as never)
    vi.mocked(prisma.court.findMany).mockResolvedValue(mockCourts as never)

    await getCachedTimeSlots()
    await getCachedCourts()

    invalidateCache()

    await getCachedTimeSlots()
    await getCachedCourts()

    expect(prisma.timeSlot.findMany).toHaveBeenCalledTimes(2)
    expect(prisma.court.findMany).toHaveBeenCalledTimes(2)
  })

  it('clears only specified key', async () => {
    const mockTimeSlots = [{ id: '1', slotTime: '09:00', createdAt: new Date() }]
    const mockCourts = [{ id: 1, name: 'Court 1', isActive: true, createdAt: new Date() }]

    vi.mocked(prisma.timeSlot.findMany).mockResolvedValue(mockTimeSlots as never)
    vi.mocked(prisma.court.findMany).mockResolvedValue(mockCourts as never)

    await getCachedTimeSlots()
    await getCachedCourts()

    invalidateCache('courts')

    await getCachedTimeSlots()
    await getCachedCourts()

    expect(prisma.timeSlot.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.court.findMany).toHaveBeenCalledTimes(2)
  })
})
