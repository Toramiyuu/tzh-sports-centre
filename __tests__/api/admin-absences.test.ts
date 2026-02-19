import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'
import { AbsenceType, AbsenceStatus } from '@prisma/client'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    absence: {
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    replacementCredit: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/admin/absences/route'
import { PATCH } from '@/app/api/admin/absences/[id]/review/route'

function makeReviewReq(id: string, body: Record<string, unknown>) {
  return createMockNextRequest({
    method: 'PATCH',
    url: `http://localhost:3000/api/admin/absences/${id}/review`,
    body,
  })
}

describe('GET /api/admin/absences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/absences' })
    const res = await GET(req)
    await expectJsonResponse(res, 401)
  })

  it('returns 401 when authenticated but not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/absences' })
    const res = await GET(req)
    await expectJsonResponse(res, 401)
  })

  it('returns all absences for admin with no filters', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    const mockAbsences = [
      {
        id: 'absence-1',
        type: AbsenceType.MEDICAL,
        status: AbsenceStatus.PENDING_REVIEW,
        user: { name: 'Alice', phone: '+60123456789' },
        lessonSession: { lessonDate: new Date(), startTime: '09:00', court: { name: 'Court 1' } },
      },
    ]
    vi.mocked(prisma.absence.findMany).mockResolvedValue(mockAbsences as never)
    vi.mocked(prisma.absence.count).mockResolvedValue(1 as never)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/admin/absences' })
    const res = await GET(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.absences).toHaveLength(1)
    expect(json.total).toBe(1)
  })

  it('filters by type query param', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.absence.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.absence.count).mockResolvedValue(0 as never)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/absences',
      searchParams: { type: 'MEDICAL' },
    })
    await GET(req)
    expect(prisma.absence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: AbsenceType.MEDICAL }) as unknown,
      })
    )
  })

  it('filters by status query param', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.absence.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.absence.count).mockResolvedValue(0 as never)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/absences',
      searchParams: { status: 'PENDING_REVIEW' },
    })
    await GET(req)
    expect(prisma.absence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: AbsenceStatus.PENDING_REVIEW }) as unknown,
      })
    )
  })

  it('filters by userId query param', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.absence.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.absence.count).mockResolvedValue(0 as never)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/absences',
      searchParams: { userId: 'student-123' },
    })
    await GET(req)
    expect(prisma.absence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'student-123' }) as unknown,
      })
    )
  })

  it('filters by dateStart and dateEnd query params', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
    vi.mocked(prisma.absence.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.absence.count).mockResolvedValue(0 as never)

    const req = createMockNextRequest({
      url: 'http://localhost:3000/api/admin/absences',
      searchParams: { dateStart: '2026-02-01', dateEnd: '2026-02-28' },
    })
    await GET(req)
    expect(prisma.absence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lessonDate: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) } as unknown) as unknown,
        }) as unknown,
      })
    )
  })
})

describe('PATCH /api/admin/absences/[id]/review', () => {
  const params = Promise.resolve({ id: 'absence-1' })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = makeReviewReq('absence-1', { creditAwarded: false })
    const res = await PATCH(req, { params })
    await expectJsonResponse(res, 401)
  })

  it('returns 401 when authenticated but not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)
    const req = makeReviewReq('absence-1', { creditAwarded: false })
    const res = await PATCH(req, { params })
    await expectJsonResponse(res, 401)
  })

  it('reviews PENDING_REVIEW absence and creates notification', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockAbsence = {
      id: 'absence-1',
      userId: 'student-123',
      status: AbsenceStatus.REVIEWED,
      adminNotes: 'Approved',
      creditAwarded: false,
    }
    vi.mocked(prisma.$transaction).mockResolvedValue(mockAbsence as never)
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)

    const req = makeReviewReq('absence-1', { creditAwarded: false, adminNotes: 'Approved' })
    const res = await PATCH(req, { params })
    await expectJsonResponse(res, 200)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(prisma.notification.create).toHaveBeenCalledOnce()
  })

  it('creates ReplacementCredit inside transaction when creditAwarded=true', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockAbsence = {
      id: 'absence-1',
      userId: 'student-123',
      status: AbsenceStatus.REVIEWED,
      creditAwarded: true,
    }
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const txMock = {
        absence: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUniqueOrThrow: vi.fn().mockResolvedValue({ userId: 'student-123' }),
          findUnique: vi.fn().mockResolvedValue({
            id: 'absence-1',
            userId: 'student-123',
            status: AbsenceStatus.REVIEWED,
            creditAwarded: true,
          }),
        },
        replacementCredit: { create: vi.fn().mockResolvedValue({ id: 'credit-1' }) },
      }
      return fn(txMock as never)
    })
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never)

    const req = makeReviewReq('absence-1', { creditAwarded: true })
    const res = await PATCH(req, { params })
    await expectJsonResponse(res, 200)
  })

  it('returns 400 when absence is not in PENDING_REVIEW status', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const txMock = {
        absence: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        replacementCredit: { create: vi.fn() },
      }
      return fn(txMock as never)
    })

    const req = makeReviewReq('absence-1', { creditAwarded: false })
    const res = await PATCH(req, { params })
    await expectJsonResponse(res, 400, { error: expect.stringContaining('PENDING_REVIEW') as unknown as string })
  })
})
