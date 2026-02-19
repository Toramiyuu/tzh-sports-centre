import { describe, it, expect, vi, beforeEach } from 'vitest'
import { expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    replacementBooking: {
      findMany: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/replacement/my-bookings/route'

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

const mockUser = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  isMember: true,
}

const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  status: 'CONFIRMED',
  lessonSession: {
    id: 'session-1',
    lessonDate: futureDate,
    startTime: '15:00',
    endTime: '16:00',
    lessonType: 'small-adult-group',
    court: { name: 'Court 1' },
  },
  replacementCredit: {
    id: 'credit-1',
    absence: { lessonDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
}


describe('GET /api/replacement/my-bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const res = await GET()
    await expectJsonResponse(res, 401)
  })

  it('returns 404 when user not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const res = await GET()
    await expectJsonResponse(res, 404)
  })

  it('returns confirmed future bookings for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementBooking.findMany).mockResolvedValue([mockBooking] as never)
    const res = await GET()
    const json = await expectJsonResponse(res, 200)
    expect(json.bookings).toHaveLength(1)
    expect(json.bookings[0].id).toBe('booking-1')
    expect(json.bookings[0].lessonSession.court.name).toBe('Court 1')
  })

  it('returns empty array when no bookings exist', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementBooking.findMany).mockResolvedValue([])
    const res = await GET()
    const json = await expectJsonResponse(res, 200)
    expect(json.bookings).toHaveLength(0)
  })
})
