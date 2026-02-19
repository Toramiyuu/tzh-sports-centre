import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    replacementBooking: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/admin/replacement/route'

const mockBookings = [
  {
    id: 'booking-1',
    status: 'CONFIRMED',
    createdAt: new Date(),
    user: { id: 'user-1', name: 'Alice', email: 'alice@test.com' },
    lessonSession: {
      lessonDate: new Date(Date.now() + 86400000),
      startTime: '15:00',
      endTime: '16:00',
      court: { name: 'Court 1' },
      lessonType: 'group_8',
    },
    replacementCredit: {
      absence: { lessonDate: new Date(Date.now() - 86400000), type: 'APPLY' },
    },
  },
]

describe('GET /api/admin/replacement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/replacement' })
    const res = await GET(req)
    await expectJsonResponse(res, 401)
  })

  it('returns 401 when authenticated but not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/replacement' })
    const res = await GET(req)
    await expectJsonResponse(res, 401)
  })

  it('returns all replacement bookings for admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.replacementBooking.findMany).mockResolvedValue(mockBookings as never)
    vi.mocked(prisma.replacementBooking.count).mockResolvedValue(1)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/replacement' })
    const res = await GET(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.bookings).toHaveLength(1)
    expect(json.total).toBe(1)
  })

  it('filters by status when status param provided', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.replacementBooking.findMany).mockResolvedValue([])
    vi.mocked(prisma.replacementBooking.count).mockResolvedValue(0)
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/replacement',
      searchParams: { status: 'CANCELLED' },
    })
    const res = await GET(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.bookings).toHaveLength(0)
    expect(prisma.replacementBooking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'CANCELLED' }),
      })
    )
  })

  it('returns 400 for invalid status filter', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/replacement',
      searchParams: { status: 'INVALID_STATUS' },
    })
    const res = await GET(req)
    await expectJsonResponse(res, 400)
  })

  it('returns empty list when no bookings exist', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.replacementBooking.findMany).mockResolvedValue([])
    vi.mocked(prisma.replacementBooking.count).mockResolvedValue(0)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/replacement' })
    const res = await GET(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.bookings).toHaveLength(0)
    expect(json.total).toBe(0)
  })
})
