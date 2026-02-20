import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest } from '../helpers/api-helpers'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lessonType: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('GET /api/lesson-types (public)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns active lesson types without auth', async () => {
    vi.mocked(prisma.lessonType.findMany).mockResolvedValue([
      {
        id: 'lt1', name: '1-to-1 Private', slug: '1-to-1', description: 'Private coaching',
        detailedDescription: 'Full private coaching', billingType: 'per_session',
        price: 130, maxStudents: 1, sessionsPerMonth: null, isActive: true,
        pricingTiers: [{ id: 'pt1', duration: 1.5, price: 130 }, { id: 'pt2', duration: 2, price: 160 }],
      },
      {
        id: 'lt2', name: 'Kids Group', slug: 'kids-group', description: 'Monthly kids',
        detailedDescription: null, billingType: 'monthly',
        price: 50, maxStudents: 6, sessionsPerMonth: 4, isActive: true,
        pricingTiers: [],
      },
    ] as never)

    const { GET } = await import('@/app/api/lesson-types/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/lesson-types' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.lessonTypes).toHaveLength(2)
    expect(json.lessonTypes[0].slug).toBe('1-to-1')
    expect(json.lessonTypes[0].pricingTiers).toHaveLength(2)
    expect(json.lessonTypes[1].sessionsPerMonth).toBe(4)
  })

  it('only returns active lesson types', async () => {
    vi.mocked(prisma.lessonType.findMany).mockResolvedValue([])

    const { GET } = await import('@/app/api/lesson-types/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/lesson-types' })
    await GET(req)

    expect(prisma.lessonType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it('returns sorted by billingType and price', async () => {
    vi.mocked(prisma.lessonType.findMany).mockResolvedValue([])

    const { GET } = await import('@/app/api/lesson-types/route')
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/lesson-types' })
    await GET(req)

    expect(prisma.lessonType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ billingType: 'asc' }, { price: 'asc' }],
      })
    )
  })
})
