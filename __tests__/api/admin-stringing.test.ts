import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getOrders, PATCH as updateOrder } from '@/app/api/admin/stringing/route'
import { GET as getStock, POST as createStock } from '@/app/api/admin/stringing/stock/route'
import {
  GET as getStockDetail,
  PATCH as updateStockById,
  DELETE as deleteStock,
} from '@/app/api/admin/stringing/stock/[stockId]/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stringingOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    stringStock: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    stringStockLog: {
      create: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

describe('GET /api/admin/stringing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing',
    })

    const response = await getOrders(request)

    await expectJsonResponse(response, 401, {
      message: 'Unauthorized',
    })
  })

  it('returns orders with stats', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        uid: BigInt(1),
        stringName: 'Yonex BG80',
        paymentStatus: 'paid',
        createdAt: new Date('2026-02-15'),
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com', phone: '0123456789' },
      },
    ]

    vi.mocked(prisma.stringingOrder.findMany).mockResolvedValue(mockOrders as never)
    vi.mocked(prisma.stringingOrder.count)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing',
    })

    const response = await getOrders(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.orders).toHaveLength(1)
    expect(json.orders[0].uid).toBe('1')
    expect(json.stats).toMatchObject({
      totalOrders: 10,
      pendingOrders: 3,
      paidOrders: 7,
    })
  })

  it('filters orders by status', async () => {
    vi.mocked(prisma.stringingOrder.findMany).mockResolvedValue([])
    vi.mocked(prisma.stringingOrder.count).mockResolvedValue(0)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing',
      searchParams: {
        status: 'paid',
      },
    })

    await getOrders(request)

    expect(prisma.stringingOrder.findMany).toHaveBeenCalledWith({
      where: { paymentStatus: 'paid' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    })
  })

  it('filters orders by time period', async () => {
    vi.mocked(prisma.stringingOrder.findMany).mockResolvedValue([])
    vi.mocked(prisma.stringingOrder.count).mockResolvedValue(0)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing',
      searchParams: {
        time: 'week',
      },
    })

    await getOrders(request)

    expect(prisma.stringingOrder.findMany).toHaveBeenCalledWith({
      where: { createdAt: { gte: expect.any(Date) } },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('PATCH /api/admin/stringing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'markPaid',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 401, {
      message: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Missing required fields',
    })
  })

  it('marks order as paid', async () => {
    const mockOrder = {
      id: 'order-1',
      uid: BigInt(1),
      paymentStatus: 'paid',
      markedPaidBy: 'admin@example.com',
      markedPaidAt: new Date(),
    }

    vi.mocked(prisma.stringingOrder.update).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'markPaid',
      },
    })

    const response = await updateOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.order.id).toBe('order-1')
    expect(json.order.uid).toBe('1')

    expect(prisma.stringingOrder.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        paymentStatus: 'paid',
        markedPaidBy: 'admin@test.com',
        markedPaidAt: expect.any(Date),
      },
    })
  })

  it('returns 400 when assignJobUid is missing jobUid', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'assignJobUid',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Job UID is required',
    })
  })

  it('returns 400 when jobUid is already in use', async () => {
    const existingOrder = {
      id: 'order-2',
      jobUid: 'FEB-001-2026',
    }

    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(existingOrder as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'assignJobUid',
        jobUid: 'FEB-001-2026',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'This Job UID is already in use',
    })
  })

  it('assigns jobUid and sets status/receivedAt if not already set', async () => {
    const currentOrder = {
      id: 'order-1',
      status: null,
      receivedAt: null,
    }

    const updatedOrder = {
      id: 'order-1',
      uid: BigInt(1),
      jobUid: 'FEB-001-2026',
      status: 'RECEIVED',
      receivedAt: new Date(),
    }

    vi.mocked(prisma.stringingOrder.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(currentOrder as never)

    vi.mocked(prisma.stringingOrder.update).mockResolvedValue(updatedOrder as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'assignJobUid',
        jobUid: 'FEB-001-2026',
      },
    })

    const response = await updateOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.order.jobUid).toBe('FEB-001-2026')

    expect(prisma.stringingOrder.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        jobUid: 'FEB-001-2026',
        status: 'RECEIVED',
        receivedAt: expect.any(Date),
      },
    })
  })

  it('returns 400 when updateStatus has invalid status', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'updateStatus',
        status: 'INVALID_STATUS',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Invalid status',
    })
  })

  it('returns 404 when order is not found for updateStatus', async () => {
    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'nonexistent',
        action: 'updateStatus',
        status: 'IN_PROGRESS',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 404, {
      message: 'Order not found',
    })
  })

  it('updates status and sets timestamp if not already set', async () => {
    const currentOrder = {
      id: 'order-1',
      status: 'RECEIVED',
      receivedAt: new Date('2026-02-15'),
      inProgressAt: null,
    }

    const updatedOrder = {
      ...currentOrder,
      uid: BigInt(1),
      status: 'IN_PROGRESS',
      inProgressAt: new Date(),
    }

    vi.mocked(prisma.stringingOrder.findUnique).mockResolvedValue(currentOrder as never)
    vi.mocked(prisma.stringingOrder.update).mockResolvedValue(updatedOrder as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'updateStatus',
        status: 'IN_PROGRESS',
      },
    })

    const response = await updateOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.order.status).toBe('IN_PROGRESS')

    expect(prisma.stringingOrder.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        status: 'IN_PROGRESS',
        inProgressAt: expect.any(Date),
      },
    })
  })

  it('returns 400 for invalid action', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing',
      body: {
        orderId: 'order-1',
        action: 'invalidAction',
      },
    })

    const response = await updateOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Invalid action',
    })
  })
})

describe('GET /api/admin/stringing/stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const response = await getStock()

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns all stock records', async () => {
    const mockStock = [
      { id: 'stock-1', stringId: 'yonex-bg80', color: 'Red', quantity: 5 },
      { id: 'stock-2', stringId: 'yonex-bg80', color: 'Blue', quantity: 3 },
    ]

    vi.mocked(prisma.stringStock.findMany).mockResolvedValue(mockStock as never)

    const response = await getStock()

    const json = await expectJsonResponse(response, 200)

    expect(json.stock).toHaveLength(2)
    expect(json.stock[0].stringId).toBe('yonex-bg80')
  })
})

describe('POST /api/admin/stringing/stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/stringing/stock',
      body: {
        stringId: 'yonex-bg80',
        color: 'red',
      },
    })

    const response = await createStock(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/stringing/stock',
      body: {
        stringId: 'yonex-bg80',
      },
    })

    const response = await createStock(request)

    await expectJsonResponse(response, 400, {
      error: 'String ID and color are required',
    })
  })

  it('returns 400 when color already exists', async () => {
    const existingStock = [{ id: 'stock-1', stringId: 'yonex-bg80', color: 'Red', quantity: 5 }]

    vi.mocked(prisma.stringStock.findMany).mockResolvedValue(existingStock as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/stringing/stock',
      body: {
        stringId: 'yonex-bg80',
        color: 'red',
      },
    })

    const response = await createStock(request)

    await expectJsonResponse(response, 400, {
      error: 'Color "Red" already exists for this string',
    })
  })

  it('creates stock record with normalized color and logs the change', async () => {
    vi.mocked(prisma.stringStock.findMany).mockResolvedValue([])

    const mockStock = {
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'Red',
      quantity: 10,
      lowStockAlert: 3,
    }

    vi.mocked(prisma.stringStock.create).mockResolvedValue(mockStock as never)
    vi.mocked(prisma.stringStockLog.create).mockResolvedValue({} as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/stringing/stock',
      body: {
        stringId: 'yonex-bg80',
        color: 'red',
        quantity: 10,
        lowStockAlert: 3,
      },
    })

    const response = await createStock(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.stock.color).toBe('Red')
    expect(json.stock.quantity).toBe(10)

    expect(prisma.stringStock.create).toHaveBeenCalledWith({
      data: {
        stringId: 'yonex-bg80',
        color: 'Red',
        quantity: 10,
        lowStockAlert: 3,
        lastUpdatedBy: 'admin@test.com',
      },
    })

    expect(prisma.stringStockLog.create).toHaveBeenCalledWith({
      data: {
        stockId: 'stock-1',
        previousQty: 0,
        newQty: 10,
        changeType: 'color_added',
        reason: 'Added color variant: Red',
        changedBy: 'admin@test.com',
      },
    })
  })
})

describe('GET /api/admin/stringing/stock/[stockId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
    })

    const response = await getStockDetail(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 404 when stock is not found', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing/stock/nonexistent',
    })

    const response = await getStockDetail(request, {
      params: Promise.resolve({ stockId: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      error: 'Stock not found',
    })
  })

  it('returns stock with recent logs', async () => {
    const mockStock = {
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'Red',
      quantity: 5,
      logs: [
        { id: 'log-1', changeType: 'restock', previousQty: 3, newQty: 5 },
        { id: 'log-2', changeType: 'order', previousQty: 4, newQty: 3 },
      ],
    }

    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(mockStock as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
    })

    const response = await getStockDetail(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.stock.id).toBe('stock-1')
    expect(json.stock.logs).toHaveLength(2)
  })
})

describe('PATCH /api/admin/stringing/stock/[stockId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
      body: {
        quantity: 10,
      },
    })

    const response = await updateStockById(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 404 when stock is not found', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing/stock/nonexistent',
      body: {
        quantity: 10,
      },
    })

    const response = await updateStockById(request, {
      params: Promise.resolve({ stockId: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      error: 'Stock not found',
    })
  })

  it('updates quantity and creates log', async () => {
    const currentStock = {
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'Red',
      quantity: 5,
    }

    const updatedStock = {
      ...currentStock,
      quantity: 10,
    }

    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(currentStock as never)
    vi.mocked(prisma.stringStock.update).mockResolvedValue(updatedStock as never)
    vi.mocked(prisma.stringStockLog.create).mockResolvedValue({} as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
      body: {
        quantity: 10,
        reason: 'Restocked from supplier',
      },
    })

    const response = await updateStockById(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.stock.quantity).toBe(10)

    expect(prisma.stringStockLog.create).toHaveBeenCalledWith({
      data: {
        stockId: 'stock-1',
        previousQty: 5,
        newQty: 10,
        changeType: 'restock',
        reason: 'Restocked from supplier',
        changedBy: 'admin@test.com',
      },
    })
  })

  it('updates lowStockAlert without creating log', async () => {
    const currentStock = {
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'Red',
      quantity: 5,
      lowStockAlert: 3,
    }

    const updatedStock = {
      ...currentStock,
      lowStockAlert: 5,
    }

    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(currentStock as never)
    vi.mocked(prisma.stringStock.update).mockResolvedValue(updatedStock as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
      body: {
        lowStockAlert: 5,
      },
    })

    const response = await updateStockById(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.stock.lowStockAlert).toBe(5)

    expect(prisma.stringStockLog.create).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/admin/stringing/stock/[stockId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
    })

    const response = await deleteStock(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 404 when stock is not found', async () => {
    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/stringing/stock/nonexistent',
    })

    const response = await deleteStock(request, {
      params: Promise.resolve({ stockId: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      error: 'Stock not found',
    })
  })

  it('deletes stock successfully', async () => {
    const mockStock = {
      id: 'stock-1',
      stringId: 'yonex-bg80',
      color: 'Red',
      quantity: 5,
    }

    vi.mocked(prisma.stringStock.findUnique).mockResolvedValue(mockStock as never)
    vi.mocked(prisma.stringStock.delete).mockResolvedValue(mockStock as never)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/stringing/stock/stock-1',
    })

    const response = await deleteStock(request, {
      params: Promise.resolve({ stockId: 'stock-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)

    expect(prisma.stringStock.delete).toHaveBeenCalledWith({
      where: { id: 'stock-1' },
    })
  })
})
