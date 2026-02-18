import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/bookings/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    recurringBooking: {
      findMany: vi.fn(),
    },
    lessonSession: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  RATE_LIMITS: {
    booking: { maxAttempts: 10, windowMs: 900000 },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

describe('GET /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const response = await GET()

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns user bookings with court details', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const mockBookings = [
      {
        id: 'booking-1',
        userId: 'regular-user-id',
        courtId: 1,
        sport: 'badminton',
        bookingDate: new Date('2026-02-20'),
        startTime: '09:00',
        endTime: '10:00',
        totalAmount: 15,
        status: 'confirmed',
        paymentStatus: 'paid',
        court: {
          id: 1,
          name: 'Court 1',
          hourlyRate: 15,
          isActive: true,
        },
      },
    ]

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as never)

    const response = await GET()

    const json = await expectJsonResponse(response, 200)

    expect(json.bookings).toHaveLength(1)
    expect(json.bookings[0]).toMatchObject({
      id: 'booking-1',
      userId: 'regular-user-id',
      courtId: 1,
      sport: 'badminton',
      startTime: '09:00',
      endTime: '10:00',
      totalAmount: 15,
      status: 'confirmed',
      paymentStatus: 'paid',
      court: {
        id: 1,
        name: 'Court 1',
        hourlyRate: 15,
        isActive: true,
      },
    })
    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'regular-user-id',
      },
      include: {
        court: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'asc' },
      ],
    })
  })
})

describe('POST /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1')
    vi.mocked(checkRateLimit).mockReturnValue({ success: true })
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])
    vi.mocked(prisma.recurringBooking.findMany).mockResolvedValue([])
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([])
  })

  it('returns 429 when rate limit exceeded', async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ success: false })

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 429, {
      error: 'Too many requests. Please try again later.',
    })
  })

  it('returns 400 when slots are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'No slots selected',
    })
  })

  it('returns 400 when slots array is empty', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [],
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'No slots selected',
    })
  })

  it('returns 400 when date is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Date and sport are required',
    })
  })

  it('returns 400 when sport is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Date and sport are required',
    })
  })

  it('returns 400 when sport is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'tennis',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid sport type. Must be badminton or pickleball.',
    })
  })

  it('returns 400 when date is in the past', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2020-01-01',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Booking date cannot be in the past',
    })
  })

  it('returns 400 when guest phone is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
        isGuestBooking: true,
        guestName: 'Guest User',
        guestPhone: 'invalid-phone',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid phone number format. Please use a valid Malaysian phone number.',
    })
  })

  it('returns 409 when slot conflicts with existing booking', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      {
        id: 'existing-booking',
        courtId: 1,
        startTime: '09:00',
        status: 'confirmed',
      },
    ] as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
        isGuestBooking: true,
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'One or more slots are no longer available',
    })
  })

  it('returns 409 when slot conflicts with recurring booking', async () => {
    vi.mocked(prisma.recurringBooking.findMany).mockResolvedValue([
      {
        id: 'recurring-1',
        courtId: 1,
        startTime: '09:00',
        dayOfWeek: 4,
        isActive: true,
      },
    ] as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-19',
        sport: 'badminton',
        isGuestBooking: true,
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'One or more slots conflict with a recurring booking',
    })
  })

  it('returns 409 when slot conflicts with lesson session', async () => {
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([
      {
        courtId: 1,
        startTime: '09:00',
        endTime: '11:00',
      },
    ] as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:30' }],
        date: '2026-02-20',
        sport: 'badminton',
        isGuestBooking: true,
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'One or more slots conflict with a scheduled lesson',
    })
  })

  it('creates guest booking with TNG payment successfully', async () => {
    const mockBooking = {
      id: 'booking-1',
      courtId: 1,
      sport: 'badminton',
      bookingDate: new Date('2026-02-20'),
      startTime: '09:00',
      endTime: '09:30',
      totalAmount: 7.5,
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'tng',
      guestName: 'Guest User',
      guestPhone: '0123456789',
      court: { id: 1, name: 'Court 1' },
    }

    vi.mocked(prisma.booking.create).mockResolvedValue(mockBooking as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
        paymentMethod: 'tng',
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'Booking created successfully',
    })

    expect(json.bookings).toHaveLength(1)
    expect(json.bookings[0]).toMatchObject({
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'tng',
      guestName: 'Guest User',
      guestPhone: '0123456789',
    })
  })

  it('creates guest booking with DuitNow payment successfully', async () => {
    const mockBooking = {
      id: 'booking-1',
      courtId: 1,
      sport: 'badminton',
      bookingDate: new Date('2026-02-20'),
      startTime: '09:00',
      endTime: '09:30',
      totalAmount: 7.5,
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'duitnow',
      guestName: 'Guest User',
      guestPhone: '0123456789',
      court: { id: 1, name: 'Court 1' },
    }

    vi.mocked(prisma.booking.create).mockResolvedValue(mockBooking as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
        paymentMethod: 'duitnow',
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'Booking created successfully',
    })

    expect(json.bookings[0]).toMatchObject({
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentMethod: 'duitnow',
    })
  })

  it('creates logged-in user booking successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const mockBooking = {
      id: 'booking-1',
      userId: 'regular-user-id',
      courtId: 1,
      sport: 'badminton',
      bookingDate: new Date('2026-02-20'),
      startTime: '09:00',
      endTime: '09:30',
      totalAmount: 7.5,
      status: 'pending',
      paymentStatus: 'pending',
      court: { id: 1, name: 'Court 1' },
    }

    vi.mocked(prisma.booking.create).mockResolvedValue(mockBooking as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'Booking created successfully',
    })

    expect(json.bookings[0]).toMatchObject({
      userId: 'regular-user-id',
      status: 'pending',
      paymentStatus: 'pending',
    })
  })

  it('creates admin test booking successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockBooking = {
      id: 'booking-1',
      userId: 'admin-user-id',
      courtId: 1,
      sport: 'badminton',
      bookingDate: new Date('2026-02-20'),
      startTime: '09:00',
      endTime: '09:30',
      totalAmount: 7.5,
      status: 'confirmed',
      paymentStatus: 'paid',
      court: { id: 1, name: 'Court 1' },
    }

    vi.mocked(prisma.booking.create).mockResolvedValue(mockBooking as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
        isTestBooking: true,
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'Booking created successfully',
    })

    expect(json.bookings[0]).toMatchObject({
      status: 'confirmed',
      paymentStatus: 'paid',
    })
  })

  it('creates pay-at-counter booking successfully', async () => {
    const mockBooking = {
      id: 'booking-1',
      courtId: 1,
      sport: 'badminton',
      bookingDate: new Date('2026-02-20'),
      startTime: '09:00',
      endTime: '09:30',
      totalAmount: 7.5,
      status: 'confirmed',
      paymentStatus: 'pending',
      guestName: 'Guest User',
      guestPhone: '0123456789',
      court: { id: 1, name: 'Court 1' },
    }

    vi.mocked(prisma.booking.create).mockResolvedValue(mockBooking as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
        isGuestBooking: true,
        payAtCounter: true,
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'Booking created successfully',
    })

    expect(json.bookings[0]).toMatchObject({
      status: 'confirmed',
      paymentStatus: 'pending',
    })
  })

  it('handles race condition with P2002 error and cleans up', async () => {
    const mockBooking1 = {
      id: 'booking-1',
      courtId: 1,
      startTime: '09:00',
    }

    vi.mocked(prisma.booking.create)
      .mockResolvedValueOnce(mockBooking1 as never)
      .mockRejectedValueOnce({ code: 'P2002' })

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [
          { courtId: 1, slotTime: '09:00' },
          { courtId: 1, slotTime: '09:30' },
        ],
        date: '2026-02-20',
        sport: 'badminton',
        isGuestBooking: true,
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'This slot was just booked by someone else. Please select another time.',
    })

    expect(prisma.booking.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['booking-1'] } },
    })
  })

  it('creates multiple bookings for multiple slots', async () => {
    const mockBooking1 = {
      id: 'booking-1',
      courtId: 1,
      startTime: '09:00',
      endTime: '09:30',
      court: { id: 1, name: 'Court 1' },
    }

    const mockBooking2 = {
      id: 'booking-2',
      courtId: 1,
      startTime: '09:30',
      endTime: '10:00',
      court: { id: 1, name: 'Court 1' },
    }

    vi.mocked(prisma.booking.create)
      .mockResolvedValueOnce(mockBooking1 as never)
      .mockResolvedValueOnce(mockBooking2 as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/bookings',
      body: {
        slots: [
          { courtId: 1, slotTime: '09:00' },
          { courtId: 1, slotTime: '09:30' },
        ],
        date: '2026-02-20',
        sport: 'badminton',
        isGuestBooking: true,
        guestName: 'Guest User',
        guestPhone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'Booking created successfully',
    })

    expect(json.bookings).toHaveLength(2)
    expect(json.count).toBe(2)
    expect(json.bookingIds).toEqual(['booking-1', 'booking-2'])
  })
})
