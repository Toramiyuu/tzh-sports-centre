import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/payments/create-checkout/route'
import { createMockNextRequest, expectJsonResponse } from '../helpers/api-helpers'

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  formatAmountForStripe: vi.fn((amount) => Math.round(amount * 100)),
  PAYMENT_METHOD_TYPES: ['card', 'fpx'],
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
    },
    recurringBooking: {
      findMany: vi.fn(),
    },
    lessonSession: {
      findMany: vi.fn(),
    },
    court: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/cache', () => ({
  getCachedTimeSlots: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/recurring-booking-utils', () => ({
  getSlotRate: vi.fn((sport, slotTime) => {
    if (sport === 'badminton') return 7.5
    if (sport === 'pickleball') return 12.5
    return 0
  }),
}))

import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getCachedTimeSlots } from '@/lib/cache'
import { auth } from '@/lib/auth'
import { getSlotRate } from '@/lib/recurring-booking-utils'

describe('POST /api/payments/create-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])
    vi.mocked(prisma.recurringBooking.findMany).mockResolvedValue([])
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([])
    vi.mocked(getCachedTimeSlots).mockResolvedValue([
      { id: '1', slotTime: '09:00', createdAt: new Date() },
      { id: '2', slotTime: '09:30', createdAt: new Date() },
      { id: '3', slotTime: '10:00', createdAt: new Date() },
    ] as never)
    vi.mocked(prisma.court.findMany).mockResolvedValue([
      { id: 1, name: 'Court 1', hourlyRate: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ] as never)
  })

  it('returns 400 when slots are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'No slots provided',
    })
  })

  it('returns 400 when slots array is empty', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [],
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'No slots provided',
    })
  })

  it('returns 400 when date is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
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
      url: 'http://localhost:3000/api/payments/create-checkout',
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
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
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
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-19',
        sport: 'badminton',
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
        endTime: '10:00',
      },
    ] as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'One or more slots conflict with a scheduled lesson',
    })
  })

  it('creates Stripe checkout session with server-side rate calculation', async () => {
    const mockSession = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    }

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [
          { courtId: 1, slotTime: '09:00' },
          { courtId: 1, slotTime: '09:30' },
        ],
        date: '2026-02-20',
        sport: 'badminton',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.sessionId).toBe('cs_test_123')
    expect(json.url).toBe('https://checkout.stripe.com/pay/cs_test_123')

    expect(getSlotRate).toHaveBeenCalledWith('badminton', '09:00')
    expect(getSlotRate).toHaveBeenCalledWith('badminton', '09:30')

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_types: ['card', 'fpx'],
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'myr',
              product_data: expect.objectContaining({
                name: expect.stringContaining('Court 1'),
              }),
              unit_amount: 750,
            }),
            quantity: 1,
          }),
        ]),
        mode: 'payment',
        customer_email: 'test@example.com',
        metadata: expect.objectContaining({
          sport: 'badminton',
          date: '2026-02-20',
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '0123456789',
        }),
      })
    )
  })

  it('includes authenticated user data in checkout session', async () => {
    const mockSession = {
      id: 'cs_test_456',
      url: 'https://checkout.stripe.com/pay/cs_test_456',
    }

    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Logged In User',
      },
    } as never)

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 200)

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: 'user@example.com',
        metadata: expect.objectContaining({
          userId: 'user-123',
          customerName: 'Logged In User',
          customerEmail: 'user@example.com',
        }),
      })
    )
  })

  it('calculates total correctly for pickleball', async () => {
    const mockSession = {
      id: 'cs_test_789',
      url: 'https://checkout.stripe.com/pay/cs_test_789',
    }

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/create-checkout',
      body: {
        slots: [{ courtId: 1, slotTime: '09:00' }],
        date: '2026-02-20',
        sport: 'pickleball',
      },
    })

    await POST(request)

    expect(getSlotRate).toHaveBeenCalledWith('pickleball', '09:00')
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 1250,
            }),
          }),
        ]),
      })
    )
  })
})
