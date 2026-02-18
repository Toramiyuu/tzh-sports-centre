import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateJobUid,
  parseJobUid,
  getStatusDisplayInfo,
  ORDER_STATUSES,
} from '@/lib/job-uid'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'

describe('parseJobUid', () => {
  it('parses valid Job UID format', () => {
    const result = parseJobUid('JAN-001-2026')
    expect(result).toEqual({
      month: 'JAN',
      counter: 1,
      year: 2026,
    })
  })

  it('parses Job UID with higher counter', () => {
    const result = parseJobUid('DEC-999-2025')
    expect(result).toEqual({
      month: 'DEC',
      counter: 999,
      year: 2025,
    })
  })

  it('returns null for invalid month abbreviation', () => {
    const result = parseJobUid('XXX-001-2026')
    expect(result).toBeNull()
  })

  it('returns null for lowercase month', () => {
    const result = parseJobUid('jan-001-2026')
    expect(result).toBeNull()
  })

  it('returns null for incorrect counter padding', () => {
    const result = parseJobUid('JAN-1-2026')
    expect(result).toBeNull()
  })

  it('returns null for incorrect year format', () => {
    const result = parseJobUid('JAN-001-26')
    expect(result).toBeNull()
  })

  it('returns null for completely invalid format', () => {
    const result = parseJobUid('invalid-job-uid')
    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    const result = parseJobUid('')
    expect(result).toBeNull()
  })
})

describe('getStatusDisplayInfo', () => {
  it('returns correct info for RECEIVED status', () => {
    const info = getStatusDisplayInfo('RECEIVED')
    expect(info).toEqual({
      label: 'Received',
      step: 1,
      color: 'blue',
    })
  })

  it('returns correct info for IN_PROGRESS status', () => {
    const info = getStatusDisplayInfo('IN_PROGRESS')
    expect(info).toEqual({
      label: 'In Progress',
      step: 2,
      color: 'yellow',
    })
  })

  it('returns correct info for READY status', () => {
    const info = getStatusDisplayInfo('READY')
    expect(info).toEqual({
      label: 'Ready for Pickup',
      step: 3,
      color: 'green',
    })
  })

  it('returns correct info for COLLECTED status', () => {
    const info = getStatusDisplayInfo('COLLECTED')
    expect(info).toEqual({
      label: 'Collected',
      step: 4,
      color: 'gray',
    })
  })

  it('returns Unknown for invalid status', () => {
    const info = getStatusDisplayInfo('INVALID')
    expect(info).toEqual({
      label: 'Unknown',
      step: 0,
      color: 'gray',
    })
  })
})

describe('ORDER_STATUSES', () => {
  it('contains all expected statuses in correct order', () => {
    expect(ORDER_STATUSES).toEqual(['RECEIVED', 'IN_PROGRESS', 'READY', 'COLLECTED'])
  })

  it('has correct length', () => {
    expect(ORDER_STATUSES).toHaveLength(4)
  })
})

describe('generateJobUid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates Job UID for first order of the month', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 1 }])

    const jobUid = await generateJobUid()

    expect(jobUid).toBe('JAN-001-2026')
  })

  it('generates Job UID for subsequent order', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 42 }])

    const jobUid = await generateJobUid()

    expect(jobUid).toBe('JAN-042-2026')
  })

  it('handles December correctly', async () => {
    vi.setSystemTime(new Date('2026-12-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 5 }])

    const jobUid = await generateJobUid()

    expect(jobUid).toBe('DEC-005-2026')
  })

  it('handles Malaysia timezone boundary correctly', async () => {
    vi.setSystemTime(new Date('2026-01-31T23:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 1 }])

    const jobUid = await generateJobUid()

    expect(jobUid).toBe('FEB-001-2026')
  })

  it('retries on serialization error and succeeds', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw)
      .mockRejectedValueOnce(new Error('serialization failure'))
      .mockResolvedValueOnce([{ counter: 1 }])

    const promise = generateJobUid()
    await vi.runAllTimersAsync()
    const jobUid = await promise

    expect(jobUid).toBe('JAN-001-2026')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2)
  })

  it('retries on deadlock error and succeeds', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw)
      .mockRejectedValueOnce(new Error('deadlock detected'))
      .mockResolvedValueOnce([{ counter: 1 }])

    const promise = generateJobUid()
    await vi.runAllTimersAsync()
    const jobUid = await promise

    expect(jobUid).toBe('JAN-001-2026')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2)
  })

  it('throws error after max retries', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw)
      .mockRejectedValueOnce(new Error('serialization failure'))
      .mockRejectedValueOnce(new Error('serialization failure'))
      .mockRejectedValueOnce(new Error('serialization failure'))

    let caughtError: Error | undefined
    const promise = generateJobUid().catch((e) => { caughtError = e })

    await vi.runAllTimersAsync()
    await promise

    expect(caughtError).toBeInstanceOf(Error)
    expect(caughtError!.message).toBe('serialization failure')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3)
  })

  it('throws error immediately for non-retryable errors', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'))

    await expect(generateJobUid()).rejects.toThrow('Connection refused')
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
  })

  it('throws error when query returns empty result', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockResolvedValue([])

    await expect(generateJobUid()).rejects.toThrow('Failed to generate Job UID: counter not found after upsert')
  })

  it('pads counter with zeros correctly', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'))

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 7 }])
    expect(await generateJobUid()).toBe('JAN-007-2026')

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 99 }])
    expect(await generateJobUid()).toBe('JAN-099-2026')

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ counter: 123 }])
    expect(await generateJobUid()).toBe('JAN-123-2026')
  })
})
