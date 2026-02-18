import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as createOrder, GET as getOrders } from '@/app/api/stringing/route'
import { GET as getStock } from '@/app/api/stringing/stock/route'
import { POST as trackOrder } from '@/app/api/stringing/track/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stringingOrder: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    stringStock: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    stringStockLog: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('@/lib/stringing-config', () => ({
  STRING_INVENTORY: [
    { id: 'yonex-bg80', name: 'Yonex BG80', price: 25 },
    { id: 'yonex-bg65', name: 'Yonex BG65', price: 20 },
  ],
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('POST /api/stringing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(null)
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Missing required fields',
    })
  })

  it('returns 400 when stringId does not exist in inventory', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'invalid-string',
        stringName: 'Invalid String',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Invalid string selection',
    })
  })

  it('returns 400 when phone number is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        price: 25,
        customerName: 'Test User',
        customerPhone: '123',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Invalid phone number format. Please use a valid Malaysian phone number.',
    })
  })

  it('returns 400 when email is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        customerEmail: 'invalid-email',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Invalid email address format',
    })
  })

  it('returns 400 when tension is out of range', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 40,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Tension must be between 18 and 35 lbs',
    })
  })

  it('returns 400 when pickup date is in the past', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2020-01-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Pickup date cannot be in the past',
    })
  })

  it('returns 400 when specified color is not available', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        stringColor: 'red',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'This color variant is not available',
    })
  })

  it('returns 400 when specified color is out of stock', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue({
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'red',
      quantity: 0,
    } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        stringColor: 'red',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'This color is currently out of stock',
    })
  })

  it('returns 400 when string is completely out of stock', async () => {
    vi.mocked(prisma.stringStock.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'stock-1',
        stringId: 'yonex-bg80',
        quantity: 0,
      } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'This string is currently out of stock',
    })
  })

  it('returns 400 when atomic stock decrement fails (race condition)', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue({
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'red',
      quantity: 1,
    } as never)

    vi.mocked(prisma.$queryRaw).mockResolvedValue([])

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        stringColor: 'red',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'This string is currently out of stock',
    })
  })

  it('creates order successfully with stock decrement and logs the change', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue({
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'red',
      quantity: 5,
    } as never)

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ quantity: 4 }] as never)

    const mockOrder = {
      id: 'order-1',
      jobUid: 'FEB-001-2026',
      stringName: 'Yonex BG80',
      stringColor: 'red',
      price: 25,
      customerName: 'Test User',
      pickupDate: new Date('2026-03-01'),
    }

    vi.mocked(prisma.stringingOrder.create).mockResolvedValue(mockOrder as never)
    vi.mocked(prisma.stringStockLog.create).mockResolvedValue({} as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        stringColor: 'red',
        price: 25,
        customerName: 'Test User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.order.id).toBe('order-1')
    expect(json.order.stringName).toBe('Yonex BG80')

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
    expect(prisma.stringingOrder.create).toHaveBeenCalledTimes(1)
    expect(prisma.stringStockLog.create).toHaveBeenCalledWith({
      data: {
        stockId: 'stock-1',
        previousQty: 5,
        newQty: 4,
        changeType: 'order',
        orderId: 'order-1',
        changedBy: 'system',
      },
    })
  })

  it('creates order for logged-in user with userId', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    vi.mocked(prisma.stringStock.findFirst)
      .mockResolvedValueOnce({
        id: 'stock-1',
        stringId: 'yonex-bg80',
        color: 'blue',
        quantity: 3,
      } as never)
      .mockResolvedValueOnce(null)

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ quantity: 2 }] as never)

    const mockOrder = {
      id: 'order-2',
      userId: 'regular-user-id',
      stringName: 'Yonex BG80',
      price: 25,
      customerName: 'Logged In User',
      pickupDate: new Date('2026-03-01'),
    }

    vi.mocked(prisma.stringingOrder.create).mockResolvedValue(mockOrder as never)
    vi.mocked(prisma.stringStockLog.create).mockResolvedValue({} as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing',
      body: {
        stringId: 'yonex-bg80',
        stringName: 'Yonex BG80',
        price: 25,
        customerName: 'Logged In User',
        customerPhone: '0123456789',
        racketModel: 'Yonex Astrox 88D',
        tensionMain: 26,
        tensionCross: 24,
        pickupDate: '2026-03-01',
      },
    })

    const response = await createOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)

    expect(prisma.stringingOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'regular-user-id',
        }),
      })
    )
  })
})

describe('GET /api/stringing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/stringing',
    })

    const response = await getOrders(request)

    await expectJsonResponse(response, 401, {
      message: 'Unauthorized',
    })
  })

  it('returns user orders ordered by createdAt desc', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const mockOrders = [
      {
        id: 'order-2',
        userId: 'regular-user-id',
        stringName: 'Yonex BG80',
        createdAt: new Date('2026-02-15'),
      },
      {
        id: 'order-1',
        userId: 'regular-user-id',
        stringName: 'Yonex BG65',
        createdAt: new Date('2026-02-10'),
      },
    ]

    vi.mocked(prisma.stringingOrder.findMany).mockResolvedValue(mockOrders as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/stringing',
    })

    const response = await getOrders(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.orders).toHaveLength(2)
    expect(json.orders[0].id).toBe('order-2')

    expect(prisma.stringingOrder.findMany).toHaveBeenCalledWith({
      where: { userId: 'regular-user-id' },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('GET /api/stringing/stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns stock status for all strings', async () => {
    const mockStockRecords = [
      { stringId: 'yonex-bg80', color: 'red', quantity: 5 },
      { stringId: 'yonex-bg80', color: 'blue', quantity: 0 },
      { stringId: 'yonex-bg65', color: 'white', quantity: 3 },
    ]

    vi.mocked(prisma.stringStock.findMany).mockResolvedValue(mockStockRecords as never)

    const response = await getStock()

    const json = await expectJsonResponse(response, 200)

    expect(json.stockStatus).toBeDefined()
    expect(json.stockStatus['yonex-bg80']).toMatchObject({
      inStock: true,
      colors: [{ color: 'red', inStock: true }],
    })
    expect(json.stockStatus['yonex-bg65']).toMatchObject({
      inStock: true,
      colors: [{ color: 'white', inStock: true }],
    })
  })
})

describe('POST /api/stringing/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when jobUid or phone is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing/track',
      body: {
        jobUid: 'FEB-001-2026',
      },
    })

    const response = await trackOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Job UID and phone number are required',
    })
  })

  it('returns 404 when order is not found', async () => {
    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing/track',
      body: {
        jobUid: 'FEB-001-2026',
        phone: '0123456789',
      },
    })

    const response = await trackOrder(request)

    await expectJsonResponse(response, 404, {
      message: 'Order not found',
      found: false,
    })
  })

  it('returns 404 when phone number does not match', async () => {
    const mockOrder = {
      id: 'order-1',
      jobUid: 'FEB-001-2026',
      customerPhone: '0123456789',
      status: 'RECEIVED',
    }

    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing/track',
      body: {
        jobUid: 'FEB-001-2026',
        phone: '0198765432',
      },
    })

    const response = await trackOrder(request)

    await expectJsonResponse(response, 404, {
      message: 'Phone number does not match',
      found: false,
    })
  })

  it('returns order details when jobUid and phone match', async () => {
    const mockOrder = {
      id: 'order-1',
      jobUid: 'FEB-001-2026',
      customerPhone: '0123456789',
      status: 'IN_PROGRESS',
      stringName: 'Yonex BG80',
      stringColor: 'red',
      price: 25,
      priceFinal: 25,
      racketModel: 'Yonex Astrox 88D',
      tensionMain: 26,
      tensionCross: 24,
      pickupDate: new Date('2026-03-01'),
      notes: 'Test notes',
      receivedAt: new Date('2026-02-15'),
      inProgressAt: new Date('2026-02-16'),
      readyAt: null,
      collectedAt: null,
      createdAt: new Date('2026-02-15'),
    }

    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing/track',
      body: {
        jobUid: 'FEB-001-2026',
        phone: '0123456789',
      },
    })

    const response = await trackOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.found).toBe(true)
    expect(json.order).toMatchObject({
      jobUid: 'FEB-001-2026',
      status: 'IN_PROGRESS',
      stringName: 'Yonex BG80',
      price: 25,
    })
  })

  it('matches phone numbers with different formats', async () => {
    const mockOrder = {
      id: 'order-1',
      jobUid: 'FEB-001-2026',
      customerPhone: '+60123456789',
      status: 'RECEIVED',
      stringName: 'Yonex BG80',
      price: 25,
      priceFinal: 25,
      racketModel: 'Yonex Astrox 88D',
      tensionMain: 26,
      tensionCross: 24,
      pickupDate: new Date('2026-03-01'),
      receivedAt: new Date('2026-02-15'),
      createdAt: new Date('2026-02-15'),
    }

    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/stringing/track',
      body: {
        jobUid: 'FEB-001-2026',
        phone: '0123456789',
      },
    })

    const response = await trackOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.found).toBe(true)
    expect(json.order.jobUid).toBe('FEB-001-2026')
  })
})
