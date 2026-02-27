import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, DELETE, POST, PATCH } from '@/app/api/admin/bookings/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    recurringBooking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    lessonSession: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    court: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/cache', () => ({
  getCachedTimeSlots: vi.fn(),
  getCachedCourts: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  logAdminAction: vi.fn(),
}))

vi.mock('@/lib/recurring-booking-utils', () => ({
  calculateBookingAmount: vi.fn(() => 15),
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { getCachedTimeSlots, getCachedCourts } from '@/lib/cache'
import { logAdminAction } from '@/lib/audit'

describe('GET /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCachedTimeSlots).mockResolvedValue([
      { id: '1', slotTime: '09:00', createdAt: new Date() },
    ] as never)
    vi.mocked(getCachedCourts).mockResolvedValue([
      { id: 1, name: 'Court 1', hourlyRate: 15, isActive: true },
    ] as never)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/bookings',
      searchParams: { date: '2026-02-20' },
    })

    const response = await GET(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/bookings',
      searchParams: { date: '2026-02-20' },
    })

    const response = await GET(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when date is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/bookings',
    })

    const response = await GET(request)

    await expectJsonResponse(response, 400, {
      error: 'Date is required',
    })
  })

  it('returns bookings and recurring bookings for specified date', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      {
        id: 'booking-1',
        courtId: 1,
        startTime: '09:00',
        status: 'confirmed',
        sport: 'badminton',
        court: { id: 1, name: 'Court 1' },
        user: null,
        guestName: 'Test User',
        guestPhone: '0123456789',
        guestEmail: null,
      },
    ] as never)

    vi.mocked(prisma.recurringBooking.findMany).mockResolvedValue([
      {
        id: 'recurring-1',
        courtId: 1,
        startTime: '10:00',
        dayOfWeek: 4,
        isActive: true,
        court: { id: 1, name: 'Court 1' },
        user: { name: 'Member', phone: '0111111111', email: 'member@test.com' },
      },
    ] as never)

    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([] as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/bookings',
      searchParams: { date: '2026-02-20' },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.bookings).toBeDefined()
    expect(json.recurringBookings).toBeDefined()
    expect(json.timeSlots).toBeDefined()
    expect(json.courts).toBeDefined()
  })
})

describe('DELETE /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingIds: ['booking-1'] },
    })

    const response = await DELETE(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when booking IDs are missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {},
    })

    const response = await DELETE(request)

    await expectJsonResponse(response, 400, {
      error: 'Booking ID(s) required',
    })
  })

  it('cancels bookings and logs admin action', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 2 } as never)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingIds: ['booking-1', 'booking-2'] },
    })

    const response = await DELETE(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.cancelled).toBe(2)

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['booking-1', 'booking-2'] } },
      data: { status: 'cancelled' },
    })

    expect(logAdminAction).toHaveBeenCalledWith({
      adminId: 'admin-user-id',
      adminEmail: 'admin@test.com',
      action: 'booking_cancel',
      targetType: 'booking',
      details: { bookingIds: ['booking-1', 'booking-2'], count: 2 },
    })
  })
})

describe('POST /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'All fields are required',
    })
  })

  it('returns 400 when slot conflicts with existing booking', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findFirst).mockResolvedValue({
      id: 'existing-booking',
    } as never)
    vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.court.findUnique).mockResolvedValue({ id: 1 } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'This slot is already booked',
    })
  })

  it('returns 400 when slot conflicts with recurring booking', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue({
      id: 'recurring-1',
    } as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.court.findUnique).mockResolvedValue({ id: 1 } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'This slot conflicts with a recurring booking',
    })
  })

  it('returns 400 when slot conflicts with lesson', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue({
      id: 'lesson-1',
    } as never)
    vi.mocked(prisma.court.findUnique).mockResolvedValue({ id: 1 } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'This slot conflicts with a scheduled lesson',
    })
  })

  it('returns 404 when court not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.court.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 999,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 404, {
      error: 'Court not found',
    })
  })

  it('creates admin booking with confirmed/paid status', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.court.findUnique).mockResolvedValue({ id: 1 } as never)

    vi.mocked(prisma.booking.create).mockResolvedValue({
      id: 'booking-1',
      courtId: 1,
      status: 'confirmed',
      paymentStatus: 'paid',
    } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.booking).toMatchObject({
      status: 'confirmed',
      paymentStatus: 'paid',
    })
  })

  it('returns 409 on P2002 race condition', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.recurringBooking.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.court.findUnique).mockResolvedValue({ id: 1 } as never)

    vi.mocked(prisma.booking.create).mockRejectedValue({ code: 'P2002' })

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/bookings',
      body: {
        courtId: 1,
        date: '2026-02-20',
        startTime: '09:00',
        endTime: '10:00',
        sport: 'badminton',
        guestName: 'Test',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'This slot was just booked by someone else.',
    })
  })
})

describe('PATCH /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingId: 'booking-1', action: 'approve' },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when bookingId is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { action: 'approve' },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 400, {
      error: 'Booking ID and action are required',
    })
  })

  it('returns 400 when action is invalid', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingId: 'booking-1', action: 'invalid' },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid action. Must be "approve" or "reject"',
    })
  })

  it('returns 404 when booking not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingId: 'booking-1', action: 'approve' },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 404, {
      error: 'Booking not found',
    })
  })

  it('approves receipt and marks booking as paid/confirmed', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: 'booking-1',
      guestPhone: '0123456789',
      bookingDate: new Date('2026-03-28'),
      user: null,
    } as never)
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 2 } as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingId: 'booking-1', action: 'approve', notes: 'Verified' },
    })

    const response = await PATCH(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.status).toBe('approved')
    expect(json.count).toBe(2)

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        bookingDate: new Date('2026-03-28'),
        status: { not: 'cancelled' },
      }),
      data: expect.objectContaining({
        receiptVerificationStatus: 'approved',
        verificationNotes: 'Verified',
        paymentStatus: 'paid',
        status: 'confirmed',
      }),
    })
  })

  it('rejects receipt and cancels booking', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: 'booking-1',
      guestPhone: '0123456789',
      bookingDate: new Date('2026-03-28'),
      user: null,
    } as never)
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 } as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/bookings',
      body: { bookingId: 'booking-1', action: 'reject', notes: 'Invalid receipt' },
    })

    const response = await PATCH(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.status).toBe('rejected')
    expect(json.count).toBe(1)

    expect(prisma.booking.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        bookingDate: new Date('2026-03-28'),
        status: { not: 'cancelled' },
      }),
      data: expect.objectContaining({
        receiptVerificationStatus: 'rejected',
        verificationNotes: 'Invalid receipt',
        status: 'cancelled',
      }),
    })
  })
})
