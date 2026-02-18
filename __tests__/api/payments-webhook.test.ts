import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/payments/webhook/route'
import { createMockNextRequest, expectJsonResponse } from '../helpers/api-helpers'

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
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

function createMockStripeEvent(type: string, data: Record<string, unknown>) {
  return {
    id: 'evt_test',
    type,
    data: {
      object: data,
    },
  }
}

describe('POST /api/payments/webhook', () => {
  const originalEnv = process.env.STRIPE_WEBHOOK_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  afterAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalEnv
  })

  it('returns 500 when webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 500, {
      error: 'Webhook secret not configured',
    })
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Missing stripe-signature header',
    })
  })

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=invalid',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Webhook signature verification failed',
    })
  })

  it('returns 200 for non-checkout event types', async () => {
    const event = createMockStripeEvent('payment_intent.created', {
      id: 'pi_test',
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)
  })

  it('ignores checkout.session.completed when payment status is not paid', async () => {
    const event = createMockStripeEvent('checkout.session.completed', {
      id: 'cs_test',
      payment_status: 'unpaid',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('is idempotent - skips booking creation if bookings already exist with same session ID', async () => {
    const event = createMockStripeEvent('checkout.session.completed', {
      id: 'cs_test',
      payment_status: 'paid',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)
    vi.mocked(prisma.booking.findMany).mockResolvedValueOnce([
      {
        id: 'existing-booking',
        stripeSessionId: 'cs_test',
      },
    ] as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('logs error and skips booking creation when slot conflict occurs after payment', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const event = createMockStripeEvent('checkout.session.completed', {
      id: 'cs_test',
      payment_status: 'paid',
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

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
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Slot conflict after payment'),
      expect.any(String),
      expect.any(String)
    )

    expect(prisma.$transaction).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('creates bookings in transaction when payment is successful', async () => {
    const event = createMockStripeEvent('checkout.session.completed', {
      id: 'cs_test',
      payment_status: 'paid',
      payment_intent: 'pi_test',
      payment_method_types: ['card'],
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
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

    vi.mocked(prisma.booking.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const mockBookings = [
      { id: 'booking-1', courtId: 1, startTime: '09:00' },
      { id: 'booking-2', courtId: 1, startTime: '09:30' },
    ]

    vi.mocked(prisma.$transaction).mockResolvedValue(mockBookings as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)

    const transactionOps = vi.mocked(prisma.$transaction).mock.calls[0][0]
    expect(Array.isArray(transactionOps)).toBe(true)
    expect(transactionOps).toHaveLength(2)
  })

  it('includes user ID when provided in metadata', async () => {
    const event = createMockStripeEvent('checkout.session.completed', {
      id: 'cs_test',
      payment_status: 'paid',
      payment_intent: 'pi_test',
      payment_method_types: ['card'],
      metadata: {
        slots: JSON.stringify([{ courtId: 1, slotTime: '09:00', slotRate: 7.5 }]),
        date: '2026-02-20',
        sport: 'badminton',
        customerName: 'Logged In User',
        customerEmail: 'user@example.com',
        userId: 'user-123',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)
    vi.mocked(prisma.booking.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: 'booking-1' },
    ] as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    await POST(request)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it('handles checkout.session.expired event gracefully', async () => {
    const event = createMockStripeEvent('checkout.session.expired', {
      id: 'cs_expired',
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)
  })

  it('handles payment_intent.payment_failed event gracefully', async () => {
    const event = createMockStripeEvent('payment_intent.payment_failed', {
      id: 'pi_failed',
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(event as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/payments/webhook',
      body: {},
      headers: {
        'stripe-signature': 't=123,v1=abc',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)
    expect(json.received).toBe(true)
  })
})
