import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lessonType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

describe('GET /api/admin/lesson-types', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { GET } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/lesson-types' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const { GET } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/lesson-types' })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns active lesson types by default', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findMany).mockResolvedValue([
      { id: 'lt1', name: '1-to-1 Private', billingType: 'per_session', price: 130, maxStudents: 1, isActive: true },
    ] as never)

    const { GET } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/lesson-types' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.lessonTypes).toHaveLength(1)
    expect(prisma.lessonType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it('returns all lesson types when active=false', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findMany).mockResolvedValue([])

    const { GET } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/lesson-types',
      searchParams: { active: 'false' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.lessonType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })
})

describe('POST /api/admin/lesson-types', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const { POST } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lesson-types',
      body: { name: 'Test', billingType: 'per_session', price: 100 },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing name', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const { POST } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lesson-types',
      body: { name: '', billingType: 'per_session', price: 100 },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid billing type', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const { POST } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lesson-types',
      body: { name: 'Test', billingType: 'yearly', price: 100 },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid price', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const { POST } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lesson-types',
      body: { name: 'Test', billingType: 'per_session', price: -5 },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for duplicate name', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue({ id: 'existing' } as never)

    const { POST } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lesson-types',
      body: { name: '1-to-1 Private', billingType: 'per_session', price: 130 },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('already exists')
  })

  it('creates lesson type successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.lessonType.create).mockResolvedValue({
      id: 'new-lt', name: '1-to-1 Private', billingType: 'per_session',
      price: 130, maxStudents: 1, isActive: true,
    } as never)

    const { POST } = await import('@/app/api/admin/lesson-types/route')
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lesson-types',
      body: { name: '1-to-1 Private', billingType: 'per_session', price: 130 },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.lessonType.name).toBe('1-to-1 Private')
    expect(prisma.lessonType.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '1-to-1 Private',
        billingType: 'per_session',
        price: 130,
        maxStudents: 1,
      }),
    })
  })
})

describe('PATCH /api/admin/lesson-types/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 404 for non-existent lesson type', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue(null)

    const { PATCH } = await import('@/app/api/admin/lesson-types/[id]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-types/nonexistent',
      body: { name: 'Updated' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('updates lesson type fields', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique)
      .mockResolvedValueOnce({
        id: 'lt1', name: 'Old Name', billingType: 'per_session', price: 100,
        maxStudents: 1, isActive: true,
      } as never)
      .mockResolvedValueOnce(null)
    vi.mocked(prisma.lessonType.update).mockResolvedValue({
      id: 'lt1', name: 'New Name', billingType: 'monthly', price: 50,
      maxStudents: 4, isActive: true,
    } as never)

    const { PATCH } = await import('@/app/api/admin/lesson-types/[id]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-types/lt1',
      body: { name: 'New Name', billingType: 'monthly', price: 50, maxStudents: 4 },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.lessonType.name).toBe('New Name')
  })

  it('can deactivate a lesson type', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue({
      id: 'lt1', name: 'Test', isActive: true,
    } as never)
    vi.mocked(prisma.lessonType.update).mockResolvedValue({
      id: 'lt1', name: 'Test', isActive: false,
    } as never)

    const { PATCH } = await import('@/app/api/admin/lesson-types/[id]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-types/lt1',
      body: { isActive: false },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt1' }) })
    expect(res.status).toBe(200)
    expect(prisma.lessonType.update).toHaveBeenCalledWith({
      where: { id: 'lt1' },
      data: { isActive: false },
    })
  })

  it('returns 400 for duplicate name on rename', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonType.findUnique)
      .mockResolvedValueOnce({ id: 'lt1', name: 'Old Name' } as never)
      .mockResolvedValueOnce({ id: 'lt2', name: 'Taken Name' } as never)

    const { PATCH } = await import('@/app/api/admin/lesson-types/[id]/route')
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-types/lt1',
      body: { name: 'Taken Name' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('already exists')
  })
})
