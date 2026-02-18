import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PATCH } from '@/app/api/admin/monthly-payments/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    monthlyPayment: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    paymentTransaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/recurring-booking-utils', () => ({
  calculateHours: vi.fn((start: string, end: string) => {
    const startNum = parseInt(start.replace(':', ''))
    const endNum = parseInt(end.replace(':', ''))
    return (endNum - startNum) / 100
  }),
  calculateBookingAmount: vi.fn(() => 15),
  getSportRate: vi.fn(() => 7.5),
  countSessionsInMonth: vi.fn(() => 4),
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import {
  calculateHours,
  calculateBookingAmount,
  countSessionsInMonth,
} from '@/lib/recurring-booking-utils'

describe('GET /api/admin/monthly-payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/monthly-payments',
    })

    const response = await GET(request)

    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/monthly-payments',
    })

    const response = await GET(request)

    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns billing summaries for all users with bookings', async () => {
    vi.mocked(calculateHours).mockReturnValue(1)
    vi.mocked(countSessionsInMonth).mockReturnValue(4)

    const mockUsers = [
      {
        id: 'user-1',
        uid: BigInt(1),
        name: 'User One',
        email: 'user1@example.com',
        phone: '0123456789',
        bookings: [
          {
            id: 'booking-1',
            totalAmount: 15,
            startTime: '09:00',
            endTime: '10:00',
            bookingDate: new Date('2026-02-15'),
          },
        ],
        recurringBookings: [
          {
            id: 'recurring-1',
            dayOfWeek: 1,
            startTime: '10:00',
            endTime: '11:00',
            sport: 'badminton',
            hourlyRate: null,
            court: { name: 'Court 1' },
          },
        ],
        monthlyPayments: [
          {
            id: 'payment-1',
            paidAmount: 30,
            status: 'partial',
            transactions: [],
          },
        ],
      },
    ]

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      searchParams: {
        month: '2',
        year: '2026',
      },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.users).toHaveLength(1)
    expect(json.users[0]).toMatchObject({
      userId: 'user-1',
      uid: '001',
      name: 'User One',
      email: 'user1@example.com',
      phone: '0123456789',
      totalAmount: 75,
      paidAmount: 30,
      unpaidAmount: 45,
      status: 'partial',
      regularBookings: 1,
      recurringBookings: 4,
    })

    expect(json.totals).toMatchObject({
      totalDue: 75,
      totalPaid: 30,
      totalUnpaid: 45,
      usersCount: 1,
    })
  })

  it('returns detailed breakdown when userId is provided', async () => {
    vi.mocked(calculateHours).mockReturnValue(1)

    const mockUser = {
      id: 'user-1',
      uid: BigInt(1),
      name: 'User One',
      email: 'user1@example.com',
      phone: '0123456789',
      bookings: [
        {
          id: 'booking-1',
          totalAmount: 15,
          startTime: '09:00',
          endTime: '10:00',
          bookingDate: new Date('2026-02-15'),
          sport: 'badminton',
          court: { name: 'Court 1' },
        },
      ],
      recurringBookings: [],
      monthlyPayments: [
        {
          id: 'payment-1',
          paidAmount: 10,
          status: 'partial',
          transactions: [],
        },
      ],
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      searchParams: {
        userId: 'user-1',
        month: '2',
        year: '2026',
      },
    })

    const response = await GET(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.user).toMatchObject({
      id: 'user-1',
      uid: '001',
      name: 'User One',
    })

    expect(json.breakdown).toHaveLength(1)
    expect(json.breakdown[0]).toMatchObject({
      type: 'booking',
      court: 'Court 1',
      sport: 'badminton',
      amount: 15,
    })

    expect(json.summary).toMatchObject({
      totalAmount: 15,
      paidAmount: 10,
      unpaidAmount: 5,
    })
  })

  it('returns 404 when userId is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      searchParams: {
        userId: 'nonexistent',
        month: '2',
        year: '2026',
      },
    })

    const response = await GET(request)

    await expectJsonResponse(response, 404, { error: 'User not found' })
  })
})

describe('POST /api/admin/monthly-payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(calculateHours).mockReturnValue(1)
    vi.mocked(countSessionsInMonth).mockReturnValue(4)
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userId: 'user-1',
        month: 2,
        year: 2026,
        amount: 50,
        paymentMethod: 'cash',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userId: 'user-1',
        month: 2,
        year: 2026,
        amount: 50,
        paymentMethod: 'cash',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userId: 'user-1',
        month: 2,
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Missing required fields: userId, month, year, amount, paymentMethod',
    })
  })

  it('returns 404 when user is not found', async () => {
    vi.mocked(prisma.monthlyPayment.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userId: 'nonexistent',
        month: 2,
        year: 2026,
        amount: 50,
        paymentMethod: 'cash',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 404, { error: 'User not found' })
  })

  it('records payment with idempotency', async () => {
    const existingTransaction = {
      id: 'transaction-1',
      idempotencyKey: 'key-123',
      monthlyPayment: {
        id: 'payment-1',
        paidAmount: 50,
      },
    }

    vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue(
      existingTransaction as never
    )

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userId: 'user-1',
        month: 2,
        year: 2026,
        amount: 50,
        paymentMethod: 'cash',
        idempotencyKey: 'key-123',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.duplicate).toBe(true)
    expect(json.payment.id).toBe('payment-1')
    expect(json.transaction.id).toBe('transaction-1')

    expect(prisma.monthlyPayment.upsert).not.toHaveBeenCalled()
    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled()
  })

  it('creates payment and transaction records', async () => {
    vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.monthlyPayment.findUnique).mockResolvedValue(null)

    const mockUser = {
      id: 'user-1',
      bookings: [
        {
          totalAmount: 15,
          startTime: '09:00',
          endTime: '10:00',
        },
      ],
      recurringBookings: [],
    }

    const mockPayment = {
      id: 'payment-1',
      userId: 'user-1',
      month: 2,
      year: 2026,
      totalAmount: 15,
      paidAmount: 15,
      status: 'paid',
    }

    const mockTransaction = {
      id: 'transaction-1',
      monthlyPaymentId: 'payment-1',
      amount: 15,
      paymentMethod: 'cash',
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.monthlyPayment.upsert).mockResolvedValue(mockPayment as never)
    vi.mocked(prisma.paymentTransaction.create).mockResolvedValue(mockTransaction as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userId: 'user-1',
        month: 2,
        year: 2026,
        amount: 15,
        paymentMethod: 'cash',
        reference: 'REF-123',
        notes: 'Test payment',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.payment.id).toBe('payment-1')
    expect(json.transaction.id).toBe('transaction-1')

    expect(prisma.monthlyPayment.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.paymentTransaction.create).toHaveBeenCalledTimes(1)
  })
})

describe('PATCH /api/admin/monthly-payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(calculateHours).mockReturnValue(1)
    vi.mocked(countSessionsInMonth).mockReturnValue(4)
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userIds: ['user-1'],
        month: 2,
        year: 2026,
        paymentMethod: 'cash',
      },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userIds: ['user-1'],
        month: 2,
        year: 2026,
        paymentMethod: 'cash',
      },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 401, { error: 'Unauthorized' })
  })

  it('returns 400 when userIds is missing or not an array', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        month: 2,
        year: 2026,
        paymentMethod: 'cash',
      },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 400, { error: 'userIds array required' })
  })

  it('returns 400 when userIds is an empty array', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userIds: [],
        month: 2,
        year: 2026,
        paymentMethod: 'cash',
      },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 400, { error: 'userIds array required' })
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userIds: ['user-1'],
        month: 2,
      },
    })

    const response = await PATCH(request)

    await expectJsonResponse(response, 400, {
      error: 'Missing required fields: month, year, paymentMethod',
    })
  })

  it('bulk marks multiple users as paid', async () => {
    const mockUser1 = {
      id: 'user-1',
      name: 'User One',
      bookings: [{ totalAmount: 15, startTime: '09:00', endTime: '10:00' }],
      recurringBookings: [],
      monthlyPayments: [],
    }

    const mockUser2 = {
      id: 'user-2',
      name: 'User Two',
      bookings: [{ totalAmount: 30, startTime: '09:00', endTime: '11:00' }],
      recurringBookings: [],
      monthlyPayments: [],
    }

    const mockPayment1 = { id: 'payment-1', userId: 'user-1' }
    const mockPayment2 = { id: 'payment-2', userId: 'user-2' }

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockUser1 as never)
      .mockResolvedValueOnce(mockUser2 as never)

    vi.mocked(prisma.monthlyPayment.upsert)
      .mockResolvedValueOnce(mockPayment1 as never)
      .mockResolvedValueOnce(mockPayment2 as never)

    vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
      id: 'transaction-1',
    } as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userIds: ['user-1', 'user-2'],
        month: 2,
        year: 2026,
        paymentMethod: 'bank_transfer',
        reference: 'BULK-001',
      },
    })

    const response = await PATCH(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.processed).toBe(2)
    expect(json.results).toHaveLength(2)
    expect(json.results[0]).toMatchObject({
      userId: 'user-1',
      name: 'User One',
      amount: 15,
      success: true,
    })
    expect(json.results[1]).toMatchObject({
      userId: 'user-2',
      name: 'User Two',
      amount: 30,
      success: true,
    })

    expect(prisma.monthlyPayment.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.paymentTransaction.create).toHaveBeenCalledTimes(2)
  })

  it('skips users with no bookings or already paid', async () => {
    const mockUser1 = {
      id: 'user-1',
      name: 'User One',
      bookings: [],
      recurringBookings: [],
      monthlyPayments: [],
    }

    const mockUser2 = {
      id: 'user-2',
      name: 'User Two',
      bookings: [{ totalAmount: 15, startTime: '09:00', endTime: '10:00' }],
      recurringBookings: [],
      monthlyPayments: [
        {
          paidAmount: 15,
        },
      ],
    }

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockUser1 as never)
      .mockResolvedValueOnce(mockUser2 as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/monthly-payments',
      body: {
        userIds: ['user-1', 'user-2'],
        month: 2,
        year: 2026,
        paymentMethod: 'cash',
      },
    })

    const response = await PATCH(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.processed).toBe(0)
    expect(json.results).toHaveLength(0)

    expect(prisma.monthlyPayment.upsert).not.toHaveBeenCalled()
    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled()
  })
})
