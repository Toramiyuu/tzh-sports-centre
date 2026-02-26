import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getMemberAvailability } from '@/app/api/member/availability/route'
import { GET as getAdminLessons, POST as createLesson } from '@/app/api/admin/lessons/route'
import { GET as getLessonRequests, PATCH as updateLessonRequest } from '@/app/api/admin/lesson-requests/route'
import { POST as createTrialRequest } from '@/app/api/trial-requests/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    coachAvailability: {
      findMany: vi.fn(),
    },
    lessonSession: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    lessonRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lessonType: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    trialRequest: {
      create: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

describe('GET /api/member/availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/member/availability',
      searchParams: {
        date: '2026-03-28',
      },
    })

    const response = await getMemberAvailability(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 403 when user is not a member', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      isTrainee: false,
    } as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/member/availability',
      searchParams: {
        date: '2026-03-28',
      },
    })

    const response = await getMemberAvailability(request)

    await expectJsonResponse(response, 403, {
      error: 'Not a trainee',
    })
  })

  it('returns 400 when date is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      isTrainee: true,
    } as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/member/availability',
    })

    const response = await getMemberAvailability(request)

    await expectJsonResponse(response, 400, {
      error: 'Date is required',
    })
  })

  it('returns availability and scheduled lessons for a date', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      isTrainee: true,
    } as never)

    const mockRecurringAvailability = [
      { id: 'avail-1', dayOfWeek: 4, startTime: '09:00', endTime: '12:00', isRecurring: true },
    ]

    const mockSpecificAvailability = [
      {
        id: 'avail-2',
        specificDate: new Date('2026-03-28'),
        startTime: '14:00',
        endTime: '16:00',
        isRecurring: false,
      },
    ]

    const mockScheduledLessons = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:30', endTime: '11:30' },
    ]

    vi.mocked(prisma.coachAvailability.findMany)
      .mockResolvedValueOnce(mockRecurringAvailability as never)
      .mockResolvedValueOnce(mockSpecificAvailability as never)

    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue(mockScheduledLessons as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/member/availability',
      searchParams: {
        date: '2026-03-28',
      },
    })

    const response = await getMemberAvailability(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.availability).toHaveLength(2)
    expect(json.scheduledLessons).toHaveLength(2)
  })
})

describe('GET /api/admin/lessons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/lessons',
    })

    const response = await getAdminLessons(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns lessons with filters', async () => {
    const mockLessons = [
      {
        id: 'lesson-1',
        lessonDate: new Date('2026-03-28'),
        startTime: '09:00',
        endTime: '10:00',
        lessonType: 'private-1on1',
        court: { id: 1, name: 'Court 1' },
        students: [{ id: 'student-1', name: 'Student One', phone: '0123456789', skillLevel: 'beginner' }],
      },
    ]

    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue(mockLessons as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/lessons',
      searchParams: {
        date: '2026-03-28',
      },
    })

    const response = await getAdminLessons(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.lessons).toHaveLength(1)
    expect(json.lessons[0].id).toBe('lesson-1')
  })
})

describe('POST /api/admin/lessons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons',
      body: {
        courtId: 1,
        lessonDate: '2026-03-28',
        startTime: '09:00',
        lessonType: 'private-1on1',
        studentIds: ['student-1'],
      },
    })

    const response = await createLesson(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons',
      body: {
        courtId: 1,
        lessonDate: '2026-03-28',
      },
    })

    const response = await createLesson(request)

    await expectJsonResponse(response, 400, {
      error: 'Court, date, time, lesson type, and at least one student are required',
    })
  })

  it('returns 400 when lesson type is invalid', async () => {
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/lessons',
      body: {
        courtId: 1,
        lessonDate: '2026-03-28',
        startTime: '09:00',
        lessonType: 'invalid-type',
        studentIds: ['student-1'],
      },
    })

    const response = await createLesson(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid lesson type',
    })
  })
})

describe('GET /api/admin/lesson-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const response = await getLessonRequests()

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns lesson requests with member details', async () => {
    const mockRequests = [
      {
        id: 'request-1',
        memberId: 'member-1',
        lessonType: 'private-1on1',
        requestedDate: new Date('2026-03-28'),
        requestedTime: '09:00',
        status: 'pending',
        member: {
          id: 'member-1',
          name: 'Member One',
          email: 'member@example.com',
          phone: '0123456789',
          skillLevel: 'intermediate',
        },
      },
    ]

    vi.mocked(prisma.lessonRequest.findMany).mockResolvedValue(mockRequests as never)

    const response = await getLessonRequests()

    const json = await expectJsonResponse(response, 200)

    expect(json.requests).toHaveLength(1)
    expect(json.requests[0].member.name).toBe('Member One')
  })
})

describe('PATCH /api/admin/lesson-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-requests',
      body: {
        requestId: 'request-1',
        status: 'approved',
      },
    })

    const response = await updateLessonRequest(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-requests',
      body: {
        requestId: 'request-1',
      },
    })

    const response = await updateLessonRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Request ID and status are required',
    })
  })

  it('returns 400 when status is invalid', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-requests',
      body: {
        requestId: 'request-1',
        status: 'invalid-status',
      },
    })

    const response = await updateLessonRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid status',
    })
  })

  it('returns 400 when approving without courtId', async () => {
    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-requests',
      body: {
        requestId: 'request-1',
        status: 'approved',
      },
    })

    const response = await updateLessonRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Court selection is required when approving',
    })
  })

  it('returns 404 when request is not found', async () => {
    vi.mocked(prisma.lessonRequest.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-requests',
      body: {
        requestId: 'nonexistent',
        status: 'approved',
        courtId: 1,
      },
    })

    const response = await updateLessonRequest(request)

    await expectJsonResponse(response, 404, {
      error: 'Request not found',
    })
  })

  it('returns 400 when lesson type is invalid during approval', async () => {
    const mockRequest = {
      id: 'request-1',
      memberId: 'member-1',
      lessonType: 'invalid-type',
      requestedDate: new Date('2026-03-28'),
      requestedTime: '09:00',
      requestedDuration: 1.5,
      member: {
        id: 'member-1',
        name: 'Member One',
      },
    }

    vi.mocked(prisma.lessonRequest.findUnique).mockResolvedValue(mockRequest as never)
    vi.mocked(prisma.lessonType.findUnique).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/lesson-requests',
      body: {
        requestId: 'request-1',
        status: 'approved',
        courtId: 1,
      },
    })

    const response = await updateLessonRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid lesson type',
    })
  })
})

describe('POST /api/trial-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when required fields are missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/trial-requests',
      body: {
        name: 'Test User',
      },
    })

    const response = await createTrialRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Name, phone, and preferred lesson type are required',
    })
  })

  it('returns 400 when phone format is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/trial-requests',
      body: {
        name: 'Test User',
        phone: '123',
        preferredLessonType: 'private-1on1',
      },
    })

    const response = await createTrialRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Please enter a valid Malaysian phone number',
    })
  })

  it('creates trial request successfully', async () => {
    const mockTrialRequest = {
      id: 'trial-1',
      name: 'Test User',
      phone: '0123456789',
      preferredLessonType: 'private-1on1',
    }

    vi.mocked(prisma.trialRequest.create).mockResolvedValue(mockTrialRequest as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/trial-requests',
      body: {
        name: 'Test User',
        phone: '0123456789',
        email: 'test@example.com',
        preferredLessonType: 'private-1on1',
        preferredDate: '2026-03-28',
        preferredTime: '09:00',
        message: 'Looking forward to trying!',
      },
    })

    const response = await createTrialRequest(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.id).toBe('trial-1')

    expect(prisma.trialRequest.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        phone: '0123456789',
        email: 'test@example.com',
        preferredLessonType: 'private-1on1',
        preferredDate: expect.any(Date),
        preferredTime: '09:00',
        message: 'Looking forward to trying!',
      },
    })
  })
})
