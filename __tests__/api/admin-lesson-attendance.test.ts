import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lessonSession: { findUnique: vi.fn(), update: vi.fn() },
    lessonAttendance: { upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/admin/lessons/[id]/attendance/route'

const mockParams = Promise.resolve({ id: 'lesson-1' })

describe('GET /api/admin/lessons/[id]/attendance', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance' })
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(401)
  })

  it('returns 404 when lesson not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonSession.findUnique).mockResolvedValue(null)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance' })
    const res = await GET(req, { params: mockParams })
    expect(res.status).toBe(404)
  })

  it('returns students and attendances for a lesson', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonSession.findUnique).mockResolvedValue({
      id: 'lesson-1',
      students: [{ id: 'u1', name: 'Student A', phone: '0123456789' }],
      attendances: [{ id: 'att-1', userId: 'u1', status: 'PRESENT', user: { id: 'u1', name: 'Student A' } }],
    } as never)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance' })
    const res = await GET(req, { params: mockParams })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.students).toHaveLength(1)
    expect(json.attendances).toHaveLength(1)
    expect(json.attendances[0].status).toBe('PRESENT')
  })
})

describe('POST /api/admin/lessons/[id]/attendance', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 for non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance',
      body: { records: [{ userId: 'u1', status: 'PRESENT' }] },
    })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(401)
  })

  it('returns 400 when records array is empty', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance',
      body: { records: [] },
    })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid status', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance',
      body: { records: [{ userId: 'u1', status: 'INVALID' }] },
    })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(400)
  })

  it('returns 404 when lesson not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonSession.findUnique).mockResolvedValue(null)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance',
      body: { records: [{ userId: 'u1', status: 'PRESENT' }] },
    })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(404)
  })

  it('returns 400 when user not enrolled in lesson', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonSession.findUnique).mockResolvedValue({
      id: 'lesson-1',
      students: [{ id: 'u1' }],
    } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance',
      body: { records: [{ userId: 'u-not-enrolled', status: 'PRESENT' }] },
    })
    const res = await POST(req, { params: mockParams })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('not enrolled')
  })

  it('successfully records attendance and marks lesson completed', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.lessonSession.findUnique).mockResolvedValue({
      id: 'lesson-1',
      students: [{ id: 'u1' }, { id: 'u2' }],
    } as never)

    const upsertResults = [
      { id: 'att-1', userId: 'u1', status: 'PRESENT' },
      { id: 'att-2', userId: 'u2', status: 'ABSENT' },
    ]
    vi.mocked(prisma.$transaction).mockResolvedValue(upsertResults as never)
    vi.mocked(prisma.lessonSession.update).mockResolvedValue({} as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons/lesson-1/attendance',
      body: {
        records: [
          { userId: 'u1', status: 'PRESENT' },
          { userId: 'u2', status: 'ABSENT' },
        ],
      },
    })
    const res = await POST(req, { params: mockParams })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.recorded).toBe(2)
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.lessonSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lesson-1' },
        data: { status: 'completed' },
      })
    )
  })
})
