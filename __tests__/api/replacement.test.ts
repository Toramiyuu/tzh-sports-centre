import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'
import { ReplacementBookingStatus } from '@prisma/client'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    lessonSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    replacementCredit: {
      findFirst: vi.fn(),
    },
    replacementBooking: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GET as GET_AVAILABLE } from '@/app/api/replacement/available/route'
import { POST as POST_BOOK } from '@/app/api/replacement/book/route'
import { DELETE as DELETE_CANCEL } from '@/app/api/replacement/[id]/route'

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
const soon = new Date(Date.now() + 12 * 60 * 60 * 1000)
const far = new Date(Date.now() + 48 * 60 * 60 * 1000)

const mockUser = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  isMember: true,
}

const mockSession = {
  id: 'session-1',
  lessonType: 'small-adult-group',
  lessonDate: futureDate,
  startTime: '15:00',
  endTime: '16:00',
  status: 'scheduled',
  court: { name: 'Court 1' },
  students: [],
  replacementBookings: [],
}

const mockCredit = {
  id: 'credit-1',
  userId: 'user-1',
  usedAt: null,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  absence: { lessonDate: pastDate, type: 'APPLY', lessonSession: { lessonType: 'small-adult-group' } },
}

const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  replacementCreditId: 'credit-1',
  lessonSessionId: 'session-1',
  status: ReplacementBookingStatus.CONFIRMED,
  lessonSession: {
    lessonDate: far,
    startTime: '15:00',
    endTime: '16:00',
    court: { name: 'Court 1' },
  },
  replacementCredit: { id: 'credit-1', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
}


describe('GET /api/replacement/available', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/replacement/available' })
    const res = await GET_AVAILABLE(req)
    await expectJsonResponse(res, 401)
  })

  it('returns 404 when user not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/replacement/available' })
    const res = await GET_AVAILABLE(req)
    await expectJsonResponse(res, 404)
  })

  it('returns sessions with available slots', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([
      { ...mockSession, students: [], replacementBookings: [] },
    ] as never)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/replacement/available' })
    const res = await GET_AVAILABLE(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.sessions).toHaveLength(1)
    expect(json.sessions[0]).toHaveProperty('availableSlots')
    expect(json.sessions[0].availableSlots).toBeGreaterThan(0)
  })

  it('excludes sessions with no available slots', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    const fullSession = {
      ...mockSession,
      lessonType: 'small-adult-group',
      students: new Array(6).fill({ id: 'other-user' }),
      replacementBookings: [],
    }
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([fullSession] as never)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/replacement/available' })
    const res = await GET_AVAILABLE(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.sessions).toHaveLength(0)
  })

  it('returns 200 with empty array when no sessions available', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([])
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/replacement/available' })
    const res = await GET_AVAILABLE(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.sessions).toHaveLength(0)
  })
})


describe('POST /api/replacement/book', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'credit-1', lessonSessionId: 'session-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 401)
  })

  it('returns 400 when creditId missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { lessonSessionId: 'session-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 400)
  })

  it('returns 400 when lessonSessionId missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'credit-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 400)
  })

  it('returns 404 when credit not found or does not belong to user', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementCredit.findFirst).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'bad-credit', lessonSessionId: 'session-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 404)
  })

  it('returns 400 when credit is already used', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementCredit.findFirst).mockResolvedValue({
      ...mockCredit,
      usedAt: new Date(),
    } as never)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'credit-1', lessonSessionId: 'session-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 400)
  })

  it('returns 400 when credit is expired', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementCredit.findFirst).mockResolvedValue({
      ...mockCredit,
      expiresAt: new Date(Date.now() - 1000),
    } as never)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'credit-1', lessonSessionId: 'session-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 400)
  })

  it('returns 404 when session not found or is in the past', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementCredit.findFirst).mockResolvedValue(mockCredit as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'credit-1', lessonSessionId: 'bad-session' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 404)
  })

  it('creates booking and marks credit used on success', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementCredit.findFirst).mockResolvedValue(mockCredit as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue({
      ...mockSession,
      students: [],
      replacementBookings: [],
    } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        lessonSession: {
          findFirst: vi.fn().mockResolvedValue({
            ...mockSession,
            students: [],
            replacementBookings: [],
          }),
        },
        replacementCredit: {
          findFirst: vi.fn().mockResolvedValue(mockCredit),
          update: vi.fn().mockResolvedValue(mockCredit),
        },
        replacementBooking: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(mockBooking) },
      })
    })
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/replacement/book',
      body: { creditId: 'credit-1', lessonSessionId: 'session-1' },
    })
    const res = await POST_BOOK(req)
    await expectJsonResponse(res, 201)
  })
})


describe('DELETE /api/replacement/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/replacement/booking-1',
    })
    const res = await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'booking-1' }) })
    await expectJsonResponse(res, 401)
  })

  it('returns 404 when booking not found or does not belong to user', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementBooking.findFirst).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/replacement/bad-booking',
    })
    const res = await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'bad-booking' }) })
    await expectJsonResponse(res, 404)
  })

  it('cancels booking and returns credit when >24h before session', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementBooking.findFirst).mockResolvedValue(mockBooking as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        replacementBooking: { update: vi.fn().mockResolvedValue({ ...mockBooking, status: 'CANCELLED' }) },
        replacementCredit: { update: vi.fn().mockResolvedValue({ ...mockCredit, usedAt: null }) },
      })
    })
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    const req = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/replacement/booking-1',
    })
    const res = await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'booking-1' }) })
    const json = await expectJsonResponse(res, 200)
    expect(json.creditReturned).toBe(true)
  })

  it('cancels booking but forfeits credit when <=24h before session', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementBooking.findFirst).mockResolvedValue({
      ...mockBooking,
      lessonSession: { ...mockBooking.lessonSession, lessonDate: soon },
    } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        replacementBooking: { update: vi.fn().mockResolvedValue({ ...mockBooking, status: 'CANCELLED' }) },
        replacementCredit: { update: vi.fn() },
      })
    })
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    const req = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/replacement/booking-1',
    })
    const res = await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'booking-1' }) })
    const json = await expectJsonResponse(res, 200)
    expect(json.creditReturned).toBe(false)
  })

  it('cancels booking but forfeits credit when credit is expired even if >24h before session', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementBooking.findFirst).mockResolvedValue({
      ...mockBooking,
      lessonSession: { ...mockBooking.lessonSession, lessonDate: far },
      replacementCredit: { id: 'credit-1', expiresAt: new Date(Date.now() - 1000) },
    } as never)
    const txReplacementCredit = { update: vi.fn() }
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        replacementBooking: { update: vi.fn().mockResolvedValue({ ...mockBooking, status: 'CANCELLED' }) },
        replacementCredit: txReplacementCredit,
      })
    })
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    const req = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/replacement/booking-1',
    })
    const res = await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'booking-1' }) })
    const json = await expectJsonResponse(res, 200)
    expect(json.creditReturned).toBe(false)
    expect(txReplacementCredit.update).not.toHaveBeenCalled()
  })
})
