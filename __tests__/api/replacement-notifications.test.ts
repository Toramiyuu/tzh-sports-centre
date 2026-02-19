import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    replacementCredit: { findFirst: vi.fn() },
    replacementBooking: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lessonSession: { findFirst: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { POST as POST_BOOK } from '@/app/api/replacement/book/route'
import { DELETE as DELETE_CANCEL } from '@/app/api/replacement/[id]/route'

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const far = new Date(Date.now() + 48 * 60 * 60 * 1000)
const soon = new Date(Date.now() + 12 * 60 * 60 * 1000)

const mockUser = { id: 'user-1', email: 'user@test.com', name: 'Test User' }
const mockCredit = {
  id: 'credit-1',
  userId: 'user-1',
  usedAt: null,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  absence: { lessonSession: { lessonType: 'small-adult-group' } },
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
const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  replacementCreditId: 'credit-1',
  lessonSessionId: 'session-1',
  status: 'CONFIRMED',
  lessonSession: {
    lessonDate: far,
    startTime: '15:00',
    endTime: '16:00',
    court: { name: 'Court 1' },
  },
  replacementCredit: { id: 'credit-1', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
}

describe('Replacement booking notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates notification with session date and credit usage on booking', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.memberSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.replacementCredit.findFirst).mockResolvedValue(mockCredit as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(mockSession as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      return fn({
        lessonSession: {
          findFirst: vi.fn().mockResolvedValue({ ...mockSession, students: [], replacementBookings: [] }),
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
    await POST_BOOK(req)

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'replacement_booked',
          link: '/profile?tab=absences',
          userId: 'user-1',
        }),
      })
    )
    const call = vi.mocked(prisma.notification.create).mock.calls[0][0]
    expect(call.data.message).toContain('1 credit used')
  })

  it('creates notification with credit returned message on cancellation >24h', async () => {
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
    await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'booking-1' }) })

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'replacement_cancelled',
          link: '/profile?tab=absences',
        }),
      })
    )
    const call = vi.mocked(prisma.notification.create).mock.calls[0][0]
    expect(call.data.message).toContain('Credit returned')
  })

  it('creates notification with credit forfeited message on cancellation <=24h', async () => {
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
    await DELETE_CANCEL(req, { params: Promise.resolve({ id: 'booking-1' }) })

    const call = vi.mocked(prisma.notification.create).mock.calls[0][0]
    expect(call.data.message).toContain('not returned')
    expect(call.data.message).toContain('24 hours')
  })
})
