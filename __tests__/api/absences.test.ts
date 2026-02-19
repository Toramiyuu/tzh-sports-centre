import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'
import { AbsenceType, AbsenceStatus } from '@prisma/client'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    lessonSession: {
      findFirst: vi.fn(),
    },
    absence: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    replacementCredit: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GET, POST, PATCH } from '@/app/api/absences/route'
import { GET as GET_CREDITS } from '@/app/api/absences/credits/route'

const futureLesson = {
  id: 'session-1',
  lessonDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  startTime: '09:00',
  endTime: '10:00',
  students: [{ id: fixtures.userSession.user.id }],
  court: { name: 'Court 1' },
}

const pastLesson = {
  id: 'session-past',
  lessonDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  startTime: '09:00',
  endTime: '10:00',
  students: [{ id: fixtures.userSession.user.id }],
  court: { name: 'Court 1' },
}

describe('POST /api/absences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-1' },
    })
    const res = await POST(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
  })

  it('creates absence + credit atomically when lesson is 10 days away (APPLY)', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(futureLesson as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue(null)
    const mockAbsence = {
      id: 'absence-1',
      type: AbsenceType.APPLY,
      status: AbsenceStatus.APPROVED,
      lessonDate: futureLesson.lessonDate,
      appliedAt: new Date(),
    }
    vi.mocked(prisma.$transaction).mockResolvedValue(mockAbsence as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-1', reason: 'Travelling' },
    })
    const res = await POST(req)
    const json = await expectJsonResponse(res, 201)
    expect(json.absence.type).toBe(AbsenceType.APPLY)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('creates absence only (no credit) when lesson is 5 days away (LATE_NOTICE)', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    const soonLesson = {
      ...futureLesson,
      lessonDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    }
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(soonLesson as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue(null)
    const mockAbsence = {
      id: 'absence-2',
      type: AbsenceType.LATE_NOTICE,
      status: AbsenceStatus.RECORDED,
    }
    vi.mocked(prisma.$transaction).mockResolvedValue(mockAbsence as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-1' },
    })
    const res = await POST(req)
    await expectJsonResponse(res, 201)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('creates absence only when lesson is 1 day away (ABSENT)', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    const tomorrowLesson = {
      ...futureLesson,
      lessonDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    }
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(tomorrowLesson as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.$transaction).mockResolvedValue({
      id: 'absence-3',
      type: AbsenceType.ABSENT,
      status: AbsenceStatus.RECORDED,
    } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-1' },
    })
    const res = await POST(req)
    await expectJsonResponse(res, 201)
  })

  it('sets PENDING_REVIEW status when isMedical=true', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(futureLesson as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue(null)
    const mockAbsence = {
      id: 'absence-4',
      type: AbsenceType.MEDICAL,
      status: AbsenceStatus.PENDING_REVIEW,
    }
    vi.mocked(prisma.$transaction).mockResolvedValue(mockAbsence as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-1', isMedical: true, reason: 'Sick' },
    })
    const res = await POST(req)
    const json = await expectJsonResponse(res, 201)
    expect(json.absence.type).toBe(AbsenceType.MEDICAL)
    expect(json.absence.status).toBe(AbsenceStatus.PENDING_REVIEW)
  })

  it('returns 400 when user is not enrolled in the lesson session', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(null)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-99' },
    })
    const res = await POST(req)
    await expectJsonResponse(res, 400, { error: expect.stringContaining('not enrolled') as unknown as string })
  })

  it('returns 400 when lesson is in the past', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(pastLesson as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue(null)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-past' },
    })
    const res = await POST(req)
    await expectJsonResponse(res, 400, { error: expect.stringContaining('past') as unknown as string })
  })

  it('returns 409 when absence already exists for the same session', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    vi.mocked(prisma.lessonSession.findFirst).mockResolvedValue(futureLesson as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue({ id: 'existing' } as never)

    const req = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/absences',
      body: { lessonSessionId: 'session-1' },
    })
    const res = await POST(req)
    await expectJsonResponse(res, 409, { error: expect.stringContaining('already') as unknown as string })
  })
})

describe('GET /api/absences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/absences' })
    const res = await GET(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
  })

  it('returns only the authenticated user\'s absences', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    const mockAbsences = [
      {
        id: 'absence-1',
        userId: fixtures.userSession.user.id,
        type: AbsenceType.APPLY,
        status: AbsenceStatus.APPROVED,
        lessonDate: new Date(),
        lessonSession: { court: { name: 'Court 1' }, startTime: '09:00' },
      },
    ]
    vi.mocked(prisma.absence.findMany).mockResolvedValue(mockAbsences as never)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/absences' })
    const res = await GET(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.absences).toHaveLength(1)
    expect(json.absences[0].userId).toBe(fixtures.userSession.user.id)
    expect(prisma.absence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: fixtures.userSession.user.id }) as unknown })
    )
  })
})

describe('GET /api/absences/credits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({ url: 'http://localhost:3000/api/absences/credits' })
    const res = await GET_CREDITS(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
  })

  it('returns only unused non-expired credits for the authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    const mockCredits = [
      {
        id: 'credit-1',
        userId: fixtures.userSession.user.id,
        usedAt: null,
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        absence: { type: AbsenceType.APPLY, lessonDate: new Date() },
      },
    ]
    vi.mocked(prisma.replacementCredit.findMany).mockResolvedValue(mockCredits as never)

    const req = createMockNextRequest({ url: 'http://localhost:3000/api/absences/credits' })
    const res = await GET_CREDITS(req)
    const json = await expectJsonResponse(res, 200)
    expect(json.credits).toHaveLength(1)
    expect(prisma.replacementCredit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: fixtures.userSession.user.id,
          usedAt: null,
        }) as unknown,
      })
    )
  })
})

describe('PATCH /api/absences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/absences',
      body: { absenceId: 'absence-1', proofUrl: 'https://example.com/proof.jpg' },
    })
    const res = await PATCH(req)
    await expectJsonResponse(res, 401, { error: 'Unauthorized' })
  })

  it('updates proofUrl on an existing PENDING_REVIEW absence', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: fixtures.userSession.user.id } as never)
    vi.mocked(prisma.absence.findFirst).mockResolvedValue({
      id: 'absence-4',
      userId: fixtures.userSession.user.id,
      status: AbsenceStatus.PENDING_REVIEW,
    } as never)
    vi.mocked(prisma.absence.update).mockResolvedValue({
      id: 'absence-4',
      proofUrl: 'https://example.com/new-proof.jpg',
    } as never)

    const req = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/absences',
      body: { absenceId: 'absence-4', proofUrl: 'https://example.com/new-proof.jpg' },
    })
    const res = await PATCH(req)
    await expectJsonResponse(res, 200)
    expect(prisma.absence.update).toHaveBeenCalledOnce()
  })
})
