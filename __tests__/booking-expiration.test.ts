import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateExpirationTime,
  checkAndExpireBookings,
  getBookingExpirationInfo,
} from '@/lib/booking-expiration'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  getBookingExpirationWarningEmail: vi.fn((params) => ({
    subject: 'Booking Expiration Warning',
    html: `<p>Warning for ${params.userName}</p>`,
  })),
  getBookingExpiredEmail: vi.fn((params) => ({
    subject: 'Booking Expired',
    html: `<p>Expired for ${params.userName}</p>`,
  })),
}))

import { prisma } from '@/lib/prisma'
import { sendEmail, getBookingExpirationWarningEmail, getBookingExpiredEmail } from '@/lib/email'

describe('calculateExpirationTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies standard 48-hour rule for bookings more than 48 hours away', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))

    const createdAt = new Date('2026-02-17T10:00:00Z')
    const bookingDateTime = new Date('2026-02-20T14:00:00Z')

    const expiration = calculateExpirationTime(createdAt, bookingDateTime)

    expect(expiration).toEqual(new Date('2026-02-19T10:00:00Z'))
  })

  it('applies short-window rule for bookings within 48 hours', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))

    const createdAt = new Date('2026-02-17T10:00:00Z')
    const bookingDateTime = new Date('2026-02-18T14:00:00Z')

    const expiration = calculateExpirationTime(createdAt, bookingDateTime)

    expect(expiration).toEqual(new Date('2026-02-18T02:00:00Z'))
  })

  it('uses short-window rule when booking is exactly 48 hours away', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))

    const createdAt = new Date('2026-02-17T10:00:00Z')
    const bookingDateTime = new Date('2026-02-19T10:00:00Z')

    const expiration = calculateExpirationTime(createdAt, bookingDateTime)

    expect(expiration).toEqual(new Date('2026-02-18T22:00:00Z'))
  })

  it('handles bookings very close to the booking time', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))

    const createdAt = new Date('2026-02-17T10:00:00Z')
    const bookingDateTime = new Date('2026-02-17T18:00:00Z')

    const expiration = calculateExpirationTime(createdAt, bookingDateTime)

    expect(expiration).toEqual(new Date('2026-02-17T06:00:00Z'))
  })
})

describe('getBookingExpirationInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns correct expiration info for non-expired booking', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))

    const booking = {
      createdAt: new Date('2026-02-17T09:00:00Z'),
      bookingDate: new Date('2026-02-20T00:00:00Z'),
      startTime: '14:00',
      status: 'pending',
      expiredAt: null,
    }

    const info = getBookingExpirationInfo(booking)

    expect(info.isExpired).toBe(false)
    expect(info.expirationTime).toEqual(new Date('2026-02-19T09:00:00Z'))
    expect(info.hoursRemaining).toBeGreaterThan(0)
    expect(info.hoursRemaining).toBeCloseTo(47, 0)
  })

  it('returns isExpired true when status is expired', () => {
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'))

    const booking = {
      createdAt: new Date('2026-02-15T09:00:00Z'),
      bookingDate: new Date('2026-02-20T00:00:00Z'),
      startTime: '14:00',
      status: 'expired',
      expiredAt: new Date('2026-02-17T09:00:00Z'),
    }

    const info = getBookingExpirationInfo(booking)

    expect(info.isExpired).toBe(true)
    expect(info.hoursRemaining).toBe(0)
  })

  it('returns willExpireSoon true when within 24 hours of expiration', () => {
    vi.setSystemTime(new Date('2026-02-18T08:00:00Z'))

    const booking = {
      createdAt: new Date('2026-02-16T10:00:00Z'),
      bookingDate: new Date('2026-02-25T00:00:00Z'),
      startTime: '14:00',
      status: 'pending',
      expiredAt: null,
    }

    const info = getBookingExpirationInfo(booking)

    expect(info.willExpireSoon).toBe(true)
    expect(info.isExpired).toBe(false)
    expect(info.hoursRemaining).toBeCloseTo(2, 0)
  })

  it('returns correct info for past expiration time', () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    const booking = {
      createdAt: new Date('2026-02-17T09:00:00Z'),
      bookingDate: new Date('2026-02-25T00:00:00Z'),
      startTime: '14:00',
      status: 'pending',
      expiredAt: null,
    }

    const info = getBookingExpirationInfo(booking)

    expect(info.isExpired).toBe(true)
    expect(info.hoursRemaining).toBe(0)
  })
})

describe('checkAndExpireBookings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('expires bookings past their expiration time', async () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    const mockBooking = {
      id: 'booking-1',
      createdAt: new Date('2026-02-17T09:00:00Z'),
      bookingDate: new Date('2026-02-19T00:00:00Z'),
      startTime: '20:00',
      endTime: '21:00',
      status: 'pending',
      expiredAt: null,
      expirationWarningSent: false,
      userId: 'user-1',
      guestEmail: null,
      guestName: null,
      user: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      court: {
        name: 'Court 1',
      },
    }

    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking] as never)
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as never)

    const result = await checkAndExpireBookings()

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: {
        status: 'expired',
        expiredAt: new Date('2026-02-19T10:00:00Z'),
      },
    })

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: 'Booking Expired',
    }))

    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'booking_expired',
      }),
    }))

    expect(result.expired).toEqual(['booking-1'])
    expect(result.warnings).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('sends warning for bookings expiring within 24 hours', async () => {
    vi.setSystemTime(new Date('2026-02-18T12:00:00Z'))

    const mockBooking = {
      id: 'booking-1',
      createdAt: new Date('2026-02-16T14:00:00Z'),
      bookingDate: new Date('2026-02-19T00:00:00Z'),
      startTime: '22:00',
      endTime: '23:00',
      status: 'pending',
      expiredAt: null,
      expirationWarningSent: false,
      userId: 'user-1',
      guestEmail: null,
      guestName: null,
      user: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      court: {
        name: 'Court 1',
      },
    }

    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking] as never)
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as never)

    const result = await checkAndExpireBookings()

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: 'Booking Expiration Warning',
    }))

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { expirationWarningSent: true },
    })

    expect(result.expired).toEqual([])
    expect(result.warnings).toEqual(['booking-1'])
    expect(result.errors).toEqual([])
  })

  it('does not send warning if already sent', async () => {
    vi.setSystemTime(new Date('2026-02-18T12:00:00Z'))

    const mockBooking = {
      id: 'booking-1',
      createdAt: new Date('2026-02-16T14:00:00Z'),
      bookingDate: new Date('2026-02-19T00:00:00Z'),
      startTime: '22:00',
      endTime: '23:00',
      status: 'pending',
      expiredAt: null,
      expirationWarningSent: true,
      userId: 'user-1',
      guestEmail: null,
      guestName: null,
      user: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      court: {
        name: 'Court 1',
      },
    }

    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking] as never)

    const result = await checkAndExpireBookings()

    expect(sendEmail).not.toHaveBeenCalled()
    expect(result.warnings).toEqual([])
  })

  it('skips email sending when sendEmails is false', async () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    const mockBooking = {
      id: 'booking-1',
      createdAt: new Date('2026-02-17T09:00:00Z'),
      bookingDate: new Date('2026-02-19T00:00:00Z'),
      startTime: '20:00',
      endTime: '21:00',
      status: 'pending',
      expiredAt: null,
      expirationWarningSent: false,
      userId: null,
      guestEmail: 'guest@example.com',
      guestName: 'Guest User',
      user: null,
      court: {
        name: 'Court 1',
      },
    }

    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking] as never)
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)

    const result = await checkAndExpireBookings({ sendEmails: false })

    expect(sendEmail).not.toHaveBeenCalled()
    expect(prisma.booking.update).toHaveBeenCalled()
    expect(result.expired).toEqual(['booking-1'])
  })

  it('handles guest bookings correctly', async () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    const mockBooking = {
      id: 'booking-1',
      createdAt: new Date('2026-02-17T09:00:00Z'),
      bookingDate: new Date('2026-02-19T00:00:00Z'),
      startTime: '20:00',
      endTime: '21:00',
      status: 'pending',
      expiredAt: null,
      expirationWarningSent: false,
      userId: null,
      guestEmail: 'guest@example.com',
      guestName: 'Guest User',
      user: null,
      court: {
        name: 'Court 1',
      },
    }

    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking] as never)
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as never)

    const result = await checkAndExpireBookings()

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'guest@example.com',
    }))

    expect(prisma.notification.create).not.toHaveBeenCalled()

    expect(result.expired).toEqual(['booking-1'])
  })

  it('handles errors gracefully and continues processing', async () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    const mockBookings = [
      {
        id: 'booking-1',
        createdAt: new Date('2026-02-17T09:00:00Z'),
        bookingDate: new Date('2026-02-19T00:00:00Z'),
        startTime: '20:00',
        endTime: '21:00',
        status: 'pending',
        expiredAt: null,
        expirationWarningSent: false,
        userId: 'user-1',
        guestEmail: null,
        guestName: null,
        user: {
          email: 'user@example.com',
          name: 'John Doe',
        },
        court: {
          name: 'Court 1',
        },
      },
      {
        id: 'booking-2',
        createdAt: new Date('2026-02-17T09:00:00Z'),
        bookingDate: new Date('2026-02-19T00:00:00Z'),
        startTime: '21:00',
        endTime: '22:00',
        status: 'pending',
        expiredAt: null,
        expirationWarningSent: false,
        userId: 'user-2',
        guestEmail: null,
        guestName: null,
        user: {
          email: 'user2@example.com',
          name: 'Jane Doe',
        },
        court: {
          name: 'Court 2',
        },
      },
    ]

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as never)
    vi.mocked(prisma.booking.update)
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({} as never)
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as never)

    const result = await checkAndExpireBookings()

    expect(result.errors).toEqual(['booking-1'])
    expect(result.expired).toEqual(['booking-2'])
  })

  it('filters by bookingIds when provided', async () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    vi.mocked(prisma.booking.findMany).mockResolvedValue([])

    await checkAndExpireBookings({ bookingIds: ['booking-1', 'booking-2'] })

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['booking-1', 'booking-2'] },
        }),
      })
    )
  })

  it('processes confirmed bookings with pending payment', async () => {
    vi.setSystemTime(new Date('2026-02-19T10:00:00Z'))

    const mockBooking = {
      id: 'booking-1',
      createdAt: new Date('2026-02-17T09:00:00Z'),
      bookingDate: new Date('2026-02-19T00:00:00Z'),
      startTime: '20:00',
      endTime: '21:00',
      status: 'confirmed',
      paymentStatus: 'pending',
      expiredAt: null,
      expirationWarningSent: false,
      userId: 'user-1',
      guestEmail: null,
      guestName: null,
      user: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      court: {
        name: 'Court 1',
      },
    }

    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking] as never)
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never)
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as never)

    const result = await checkAndExpireBookings()

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: {
        status: 'expired',
        expiredAt: new Date('2026-02-19T10:00:00Z'),
      },
    })

    expect(result.expired).toEqual(['booking-1'])
  })
})
