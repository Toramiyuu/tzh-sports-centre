import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getProducts, POST as createProduct } from '@/app/api/shop/products/route'
import { GET as getProduct, PUT as updateProduct, DELETE as deleteProduct } from '@/app/api/shop/products/[id]/route'
import { GET as getOrders, POST as createOrder } from '@/app/api/shop/orders/route'
import { GET as getOrder, PUT as updateOrder } from '@/app/api/shop/orders/[id]/route'
import { POST as trackOrder } from '@/app/api/shop/orders/track/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    shopProduct: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shopOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

describe('GET /api/shop/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all products with filters', async () => {
    const mockProducts = [
      {
        id: 'product-1',
        productId: 'YNX-001',
        category: 'rackets',
        brand: 'Yonex',
        name: 'Astrox 99',
        fullName: 'Yonex Astrox 99 Pro',
        price: 799,
        featured: true,
        inStock: true,
      },
      {
        id: 'product-2',
        productId: 'VIC-001',
        category: 'rackets',
        brand: 'Victor',
        name: 'Thruster K9900',
        fullName: 'Victor Thruster K9900',
        price: 699,
        featured: false,
        inStock: true,
      },
    ]

    vi.mocked(prisma.shopProduct.findMany).mockResolvedValue(mockProducts as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/products',
      searchParams: {
        category: 'rackets',
        featured: 'true',
      },
    })

    const response = await getProducts(request)

    const json = await expectJsonResponse(response, 200)

    expect(json).toHaveLength(2)
    expect(prisma.shopProduct.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        category: 'rackets',
        featured: true,
        inStock: true,
      }),
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('supports search query across multiple fields', async () => {
    vi.mocked(prisma.shopProduct.findMany).mockResolvedValue([] as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/products',
      searchParams: {
        search: 'yonex',
      },
    })

    const response = await getProducts(request)

    await expectJsonResponse(response, 200)

    expect(prisma.shopProduct.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { name: { contains: 'yonex', mode: 'insensitive' } },
          { fullName: { contains: 'yonex', mode: 'insensitive' } },
          { brand: { contains: 'yonex', mode: 'insensitive' } },
          { description: { contains: 'yonex', mode: 'insensitive' } },
        ],
      }),
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })
  })
})

describe('POST /api/shop/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/products',
      body: {
        productId: 'YNX-001',
        category: 'rackets',
        brand: 'Yonex',
        name: 'Astrox 99',
        fullName: 'Yonex Astrox 99 Pro',
        price: 799,
        image: 'https://example.com/image.jpg',
      },
    })

    const response = await createProduct(request)

    await expectJsonResponse(response, 401, {
      message: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/products',
      body: {
        productId: 'YNX-001',
        category: 'rackets',
      },
    })

    const response = await createProduct(request)

    await expectJsonResponse(response, 400, {
      message: 'Missing required fields',
    })
  })

  it('creates product successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockProduct = {
      id: 'product-1',
      productId: 'YNX-001',
      category: 'rackets',
      subcategory: null,
      brand: 'Yonex',
      name: 'Astrox 99',
      fullName: 'Yonex Astrox 99 Pro',
      price: 799,
      description: null,
      specs: null,
      image: 'https://example.com/image.jpg',
      images: null,
      colors: null,
      colorImages: null,
      sizes: null,
      inStock: true,
      stockCount: 10,
      featured: false,
    }

    vi.mocked(prisma.shopProduct.create).mockResolvedValue(mockProduct as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/products',
      body: {
        productId: 'YNX-001',
        category: 'rackets',
        brand: 'Yonex',
        name: 'Astrox 99',
        fullName: 'Yonex Astrox 99 Pro',
        price: 799,
        image: 'https://example.com/image.jpg',
        stockCount: 10,
      },
    })

    const response = await createProduct(request)

    const json = await expectJsonResponse(response, 201)

    expect(json.productId).toBe('YNX-001')
    expect(json.price).toBe(799)
  })
})

describe('GET /api/shop/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 404 when product is not found', async () => {
    vi.mocked(prisma.shopProduct.findFirst).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/products/nonexistent',
    })

    const response = await getProduct(request, {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      message: 'Product not found',
    })
  })

  it('returns product by productId or id', async () => {
    const mockProduct = {
      id: 'product-1',
      productId: 'YNX-001',
      name: 'Astrox 99',
      price: 799,
    }

    vi.mocked(prisma.shopProduct.findFirst).mockResolvedValue(mockProduct as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/products/YNX-001',
    })

    const response = await getProduct(request, {
      params: Promise.resolve({ id: 'YNX-001' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.productId).toBe('YNX-001')
    expect(prisma.shopProduct.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ productId: 'YNX-001' }, { id: 'YNX-001' }],
      },
    })
  })
})

describe('PUT /api/shop/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/products/product-1',
      body: { price: 899 },
    })

    const response = await updateProduct(request, {
      params: Promise.resolve({ id: 'product-1' }),
    })

    await expectJsonResponse(response, 401, {
      message: 'Unauthorized',
    })
  })

  it('returns 404 when product is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.shopProduct.findFirst).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/products/nonexistent',
      body: { price: 899 },
    })

    const response = await updateProduct(request, {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      message: 'Product not found',
    })
  })

  it('updates product successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const existingProduct = {
      id: 'product-1',
      productId: 'YNX-001',
      price: 799,
    }

    const updatedProduct = {
      ...existingProduct,
      price: 899,
      featured: true,
    }

    vi.mocked(prisma.shopProduct.findFirst).mockResolvedValue(existingProduct as never)
    vi.mocked(prisma.shopProduct.update).mockResolvedValue(updatedProduct as never)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/products/YNX-001',
      body: {
        price: 899,
        featured: true,
      },
    })

    const response = await updateProduct(request, {
      params: Promise.resolve({ id: 'YNX-001' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.price).toBe(899)
    expect(json.featured).toBe(true)
  })
})

describe('DELETE /api/shop/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/shop/products/product-1',
    })

    const response = await deleteProduct(request, {
      params: Promise.resolve({ id: 'product-1' }),
    })

    await expectJsonResponse(response, 401, {
      message: 'Unauthorized',
    })
  })

  it('returns 404 when product is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.shopProduct.findFirst).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/shop/products/nonexistent',
    })

    const response = await deleteProduct(request, {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      message: 'Product not found',
    })
  })

  it('deletes product successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const existingProduct = {
      id: 'product-1',
      productId: 'YNX-001',
    }

    vi.mocked(prisma.shopProduct.findFirst).mockResolvedValue(existingProduct as never)
    vi.mocked(prisma.shopProduct.delete).mockResolvedValue(existingProduct as never)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/shop/products/YNX-001',
    })

    const response = await deleteProduct(request, {
      params: Promise.resolve({ id: 'YNX-001' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.message).toBe('Product deleted')
    expect(prisma.shopProduct.delete).toHaveBeenCalledWith({
      where: { id: 'product-1' },
    })
  })
})

describe('POST /api/shop/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders',
      body: {
        customerName: 'John Doe',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Customer name and phone are required',
    })
  })

  it('returns 400 when items array is empty', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders',
      body: {
        customerName: 'John Doe',
        customerPhone: '0123456789',
        items: [],
        paymentMethod: 'tng',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'At least one item is required',
    })
  })

  it('returns 400 when payment method is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders',
      body: {
        customerName: 'John Doe',
        customerPhone: '0123456789',
        items: [{ productId: 'YNX-001', name: 'Racket', price: 799, quantity: 1 }],
        paymentMethod: 'invalid',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Invalid payment method',
    })
  })

  it('returns 400 when item quantity is out of range', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders',
      body: {
        customerName: 'John Doe',
        customerPhone: '0123456789',
        items: [{ productId: 'YNX-001', name: 'Racket', price: 799, quantity: 100 }],
        paymentMethod: 'tng',
      },
    })

    const response = await createOrder(request)

    await expectJsonResponse(response, 400, {
      message: 'Item quantity must be between 1 and 99',
    })
  })

  it('calculates total server-side and creates order', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const mockOrder = {
      id: 'order-1',
      userId: 'user-1',
      customerName: 'John Doe',
      customerPhone: '0123456789',
      items: [
        { productId: 'YNX-001', name: 'Racket', price: 799, quantity: 2 },
        { productId: 'YNX-002', name: 'Shoes', price: 299, quantity: 1 },
      ],
      total: 1897,
      status: 'PENDING_PAYMENT',
      paymentMethod: 'tng',
      paymentStatus: 'pending_verification',
    }

    vi.mocked(prisma.shopOrder.create).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders',
      body: {
        customerName: 'John Doe',
        customerPhone: '0123456789',
        items: [
          { productId: 'YNX-001', name: 'Racket', price: 799, quantity: 2 },
          { productId: 'YNX-002', name: 'Shoes', price: 299, quantity: 1 },
        ],
        paymentMethod: 'tng',
      },
    })

    const response = await createOrder(request)

    const json = await expectJsonResponse(response, 201)

    expect(json.total).toBe(1897)
    expect(json.paymentStatus).toBe('pending_verification')
    expect(prisma.shopOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        total: 1897,
        paymentMethod: 'tng',
        paymentStatus: 'pending_verification',
      }),
    })
  })

  it('sets cash orders to pending payment status', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const mockOrder = {
      id: 'order-1',
      userId: null,
      customerName: 'Guest User',
      customerPhone: '0123456789',
      items: [{ productId: 'YNX-001', name: 'Racket', price: 799, quantity: 1 }],
      total: 799,
      status: 'PENDING_PAYMENT',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
    }

    vi.mocked(prisma.shopOrder.create).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders',
      body: {
        customerName: 'Guest User',
        customerPhone: '0123456789',
        items: [{ productId: 'YNX-001', name: 'Racket', price: 799, quantity: 1 }],
        paymentMethod: 'cash',
      },
    })

    const response = await createOrder(request)

    const json = await expectJsonResponse(response, 201)

    expect(json.paymentMethod).toBe('cash')
    expect(json.paymentStatus).toBe('pending')
  })
})

describe('GET /api/shop/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders',
    })

    const response = await getOrders(request)

    await expectJsonResponse(response, 401, {
      message: 'Authentication required',
    })
  })

  it('returns user orders', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const mockOrders = [
      {
        id: 'order-1',
        userId: 'user-1',
        customerName: 'Test User',
        total: 799,
      },
    ]

    vi.mocked(prisma.shopOrder.findMany).mockResolvedValue(mockOrders as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders',
    })

    const response = await getOrders(request)

    const json = await expectJsonResponse(response, 200)

    expect(json).toHaveLength(1)
    expect(prisma.shopOrder.findMany).toHaveBeenCalledWith({
      where: { userId: 'regular-user-id' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('returns all orders for admin when all=true', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockOrders = [
      { id: 'order-1', userId: 'user-1', total: 799 },
      { id: 'order-2', userId: 'user-2', total: 999 },
    ]

    vi.mocked(prisma.shopOrder.findMany).mockResolvedValue(mockOrders as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders',
      searchParams: { all: 'true' },
    })

    const response = await getOrders(request)

    const json = await expectJsonResponse(response, 200)

    expect(json).toHaveLength(2)
    expect(prisma.shopOrder.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('GET /api/shop/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 404 when order is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.shopOrder.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders/nonexistent',
    })

    const response = await getOrder(request, {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      message: 'Order not found',
    })
  })

  it('returns 403 when user is not owner or admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const mockOrder = {
      id: 'order-1',
      userId: 'other-user',
      total: 799,
    }

    vi.mocked(prisma.shopOrder.findUnique).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders/order-1',
    })

    const response = await getOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    await expectJsonResponse(response, 403, {
      message: 'Unauthorized',
    })
  })

  it('returns order for owner', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const mockOrder = {
      id: 'order-1',
      userId: 'regular-user-id',
      customerName: 'Test User',
      total: 799,
    }

    vi.mocked(prisma.shopOrder.findUnique).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders/order-1',
    })

    const response = await getOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.id).toBe('order-1')
    expect(json.userId).toBe('regular-user-id')
  })

  it('returns order for admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockOrder = {
      id: 'order-1',
      userId: 'other-user',
      total: 799,
    }

    vi.mocked(prisma.shopOrder.findUnique).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/shop/orders/order-1',
    })

    const response = await getOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.id).toBe('order-1')
  })
})

describe('PUT /api/shop/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/orders/order-1',
      body: { status: 'CONFIRMED' },
    })

    const response = await updateOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    await expectJsonResponse(response, 403, {
      message: 'Admin access required',
    })
  })

  it('returns 400 when status is invalid', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/orders/order-1',
      body: { status: 'INVALID_STATUS' },
    })

    const response = await updateOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    await expectJsonResponse(response, 400, {
      message: 'Invalid status',
    })
  })

  it('returns 400 when paymentStatus is invalid', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/orders/order-1',
      body: { paymentStatus: 'invalid' },
    })

    const response = await updateOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    await expectJsonResponse(response, 400, {
      message: 'Invalid payment status',
    })
  })

  it('updates order status successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockOrder = {
      id: 'order-1',
      status: 'CONFIRMED',
      paymentStatus: 'paid',
    }

    vi.mocked(prisma.shopOrder.update).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/shop/orders/order-1',
      body: {
        status: 'CONFIRMED',
        paymentStatus: 'paid',
      },
    })

    const response = await updateOrder(request, {
      params: Promise.resolve({ id: 'order-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.status).toBe('CONFIRMED')
    expect(json.paymentStatus).toBe('paid')
  })
})

describe('POST /api/shop/orders/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders/track',
      body: {
        orderId: 'order-1',
      },
    })

    const response = await trackOrder(request)

    await expectJsonResponse(response, 400, {
      found: false,
      message: 'Order ID and phone number are required',
    })
  })

  it('returns found=false when order is not found', async () => {
    vi.mocked(prisma.shopOrder.findFirst).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders/track',
      body: {
        orderId: 'nonexistent',
        phone: '0123456789',
      },
    })

    const response = await trackOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.found).toBe(false)
  })

  it('returns order details when found with matching phone', async () => {
    const mockOrder = {
      id: 'order-1',
      customerName: 'John Doe',
      customerPhone: '0123456789',
      items: [{ productId: 'YNX-001', name: 'Racket', price: 799, quantity: 1 }],
      total: 799,
      status: 'CONFIRMED',
      paymentMethod: 'tng',
      paymentStatus: 'paid',
      createdAt: new Date('2026-02-15'),
      updatedAt: new Date('2026-02-16'),
    }

    vi.mocked(prisma.shopOrder.findFirst).mockResolvedValue(mockOrder as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/shop/orders/track',
      body: {
        orderId: 'order-1',
        phone: '012-345-6789',
      },
    })

    const response = await trackOrder(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.found).toBe(true)
    expect(json.order.id).toBe('order-1')
    expect(json.order.customerName).toBe('John Doe')
    expect(json.order.total).toBe(799)
  })
})
