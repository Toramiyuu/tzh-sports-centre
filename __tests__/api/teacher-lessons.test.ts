import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    teacher: { findUnique: vi.fn() },
    lessonSession: { findMany: vi.fn() },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/teacher/lessons/route'

describe('GET /api/teacher/lessons', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/teacher/lessons' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 if user is not a teacher', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue(null)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/teacher/lessons' })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns upcoming lessons for authenticated teacher', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
      id: 'teacher-1', name: 'Coach Ali', userId: 'regular-user-id', isActive: true,
    } as never)
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([
      {
        id: 'ls-1',
        lessonDate: new Date('2026-03-01'),
        startTime: '09:00',
        endTime: '10:30',
        lessonType: 'private',
        duration: 1.5,
        status: 'scheduled',
        court: { id: 1, name: 'Court 1' },
        students: [{ id: 'u1', name: 'Student A' }],
        attendances: [],
      },
    ] as never)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/teacher/lessons' })
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.lessons).toHaveLength(1)
    expect(json.teacher.id).toBe('teacher-1')
  })

  it('filters by date range when provided', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
      id: 'teacher-1', name: 'Coach Ali', userId: 'regular-user-id', isActive: true,
    } as never)
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([] as never)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/teacher/lessons',
      searchParams: { from: '2026-03-01', to: '2026-03-07' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(prisma.lessonSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          teacherId: 'teacher-1',
          lessonDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    )
  })
})
