import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/payments/verify/route'
import { createMockNextRequest, expectJsonResponse } from '../helpers/api-helpers'

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

describe('GET /api/payments/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when session_id is missing', async () => {
    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
    })

    const response = await GET(request)

    await expectJsonResponse(response, 400, {
      error: 'Session ID is required',
    })
  })

  it('returns unpaid status when Stripe session payment is not complete', async () => {
    const mockSession = {
      id: 'cs_test',
      payment_status: 'unpaid',
      metadata: {},
    }

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.status).toBe('unpaid')
    expect(json.message).toBe('Payment not completed')
    expect(json.bookings).toEqual([])
  })

  it('returns 400 when session metadata is invalid', async () => {
    const mockSession = {
      id: 'cs_test',
      payment_status: 'paid',
      metadata: {
        slots: '[]',
      },
    }

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    const response = await GET(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid session metadata',
    })
  })

  it('is idempotent - returns existing bookings when found', async () => {
    const mockSession = {
      id: 'cs_test',
      payment_status: 'paid',
      customer_email: 'test@example.com',
      amount_total: 1500,
      currency: 'myr',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
      },
    }

    const existingBookings = [
      {
        id: 'booking-1',
        stripeSessionId: 'cs_test',
        courtId: 1,
        startTime: '09:00',
        status: 'confirmed',
        court: { id: 1, name: 'Court 1' },
      },
    ]

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)
    vi.mocked(prisma.booking.findMany).mockResolvedValue(existingBookings as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.status).toBe('paid')
    expect(json.bookings).toHaveLength(1)
    expect(json.bookings[0].id).toBe('booking-1')
    expect(json.amountTotal).toBe(15)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('returns conflict status when slots are taken after payment', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockSession = {
      id: 'cs_test',
      payment_status: 'paid',
      customer_email: 'test@example.com',
      amount_total: 750,
      currency: 'myr',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
      },
    }

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)

    vi.mocked(prisma.booking.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'conflicting-booking',
          courtId: 1,
          startTime: '09:00',
          status: 'confirmed',
        },
      ] as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.status).toBe('conflict')
    expect(json.message).toContain('Please contact support for a refund')
    expect(json.bookings).toEqual([])

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Slot conflict after payment! Session:',
      'cs_test',
      'Conflicts:',
      expect.any(Array)
    )

    consoleErrorSpy.mockRestore()
  })

  it('creates bookings as fallback when webhook did not run', async () => {
    const mockSession = {
      id: 'cs_test',
      payment_status: 'paid',
      payment_intent: 'pi_test',
      payment_method_types: ['card'],
      customer_email: 'test@example.com',
      amount_total: 1500,
      currency: 'myr',
      metadata: {
        slots: JSON.stringify([
          { courtId: 1, slotTime: '09:00', slotRate: 7.5 },
          { courtId: 1, slotTime: '09:30', slotRate: 7.5 },
        ]),
        date: '2026-02-20',
        sport: 'badminton',
        customerName: 'Test User',
        customerPhone: '0123456789',
        customerEmail: 'test@example.com',
        userId: '',
      },
    }

    const createdBookings = [
      {
        id: 'booking-1',
        courtId: 1,
        startTime: '09:00',
        court: { id: 1, name: 'Court 1' },
      },
      {
        id: 'booking-2',
        courtId: 1,
        startTime: '09:30',
        court: { id: 1, name: 'Court 1' },
      },
    ]

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)

    vi.mocked(prisma.booking.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    vi.mocked(prisma.$transaction).mockResolvedValue(createdBookings as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.status).toBe('paid')
    expect(json.bookings).toHaveLength(2)
    expect(json.amountTotal).toBe(15)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)

    const transactionOps = vi.mocked(prisma.$transaction).mock.calls[0][0]
    expect(Array.isArray(transactionOps)).toBe(true)
    expect(transactionOps).toHaveLength(2)
  })

  it('includes user ID in booking data when provided in metadata', async () => {
    const mockSession = {
      id: 'cs_test',
      payment_status: 'paid',
      payment_intent: 'pi_test',
      payment_method_types: ['card'],
      customer_email: 'user@example.com',
      amount_total: 750,
      currency: 'myr',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
        customerName: 'Logged In User',
        customerEmail: 'user@example.com',
        userId: 'user-123',
      },
    }

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)
    vi.mocked(prisma.booking.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    vi.mocked(prisma.$transaction).mockResolvedValue([
      {
        id: 'booking-1',
        userId: 'user-123',
        court: { id: 1, name: 'Court 1' },
      },
    ] as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    await GET(request)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it('handles expanded payment_intent object correctly', async () => {
    const mockSession = {
      id: 'cs_test',
      payment_status: 'paid',
      payment_intent: {
        id: 'pi_test',
        amount: 750,
      },
      payment_method_types: ['card'],
      customer_email: 'test@example.com',
      amount_total: 750,
      currency: 'myr',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
      },
    }

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as never)
    vi.mocked(prisma.booking.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: 'booking-1', court: { id: 1, name: 'Court 1' } },
    ] as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/payments/verify',
      searchParams: {
        session_id: 'cs_test',
      },
    })

    await GET(request)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
