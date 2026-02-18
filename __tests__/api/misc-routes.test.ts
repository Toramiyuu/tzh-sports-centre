import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getCourts } from '@/app/api/courts/route'
import { GET as getAvailability } from '@/app/api/availability/route'
import { GET as verifyEmail } from '@/app/api/verify-email/route'
import { GET as cronExpireBookings } from '@/app/api/cron/expire-bookings/route'
import { GET as getMembers, PATCH as updateMember } from '@/app/api/admin/members/route'
import {
  GET as getAccounts,
  POST as createAccount,
  PATCH as updateAccountUid,
} from '@/app/api/admin/accounts/route'
import {
  GET as getTrialRequests,
  PATCH as updateTrialRequest,
  DELETE as deleteTrialRequest,
} from '@/app/api/admin/trial-requests/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
  isSuperAdmin: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    court: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    recurringBooking: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    lessonSession: {
      findMany: vi.fn(),
    },
    lessonRequest: {
      deleteMany: vi.fn(),
    },
    trialRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/cache', () => ({
  getCachedTimeSlots: vi.fn(),
  getCachedCourts: vi.fn(),
}))

vi.mock('@/lib/holidays', () => ({
  shouldUseWeekendHours: vi.fn(),
  getHolidayName: vi.fn(),
}))

vi.mock('@/lib/malaysia-time', () => ({
  isTodayInMalaysia: vi.fn(),
  isSlotTimePast: vi.fn(),
  getMalaysiaTimeString: vi.fn(),
}))

vi.mock('@/lib/booking-expiration', () => ({
  checkAndExpireBookings: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  logAdminAction: vi.fn(),
}))

vi.mock('@/lib/validation', () => ({
  validateMalaysianPhone: vi.fn((phone) => phone.replace(/\D/g, '')),
  sanitiseText: vi.fn((text) => text),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { getCachedTimeSlots, getCachedCourts } from '@/lib/cache'
import { shouldUseWeekendHours, getHolidayName } from '@/lib/holidays'
import { isTodayInMalaysia, isSlotTimePast, getMalaysiaTimeString } from '@/lib/malaysia-time'
import { checkAndExpireBookings } from '@/lib/booking-expiration'

describe('GET /api/courts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active courts', async () => {
    const mockCourts = [
      { id: 1, name: 'Court 1', isActive: true },
      { id: 2, name: 'Court 2', isActive: true },
    ]

    vi.mocked(prisma.court.findMany).mockResolvedValue(mockCourts as never)

    const response = await getCourts()

    const json = await expectJsonResponse(response, 200)

    expect(json.courts).toHaveLength(2)
    expect(prisma.court.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    })
  })
})

describe('GET /api/availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when date is missing', async () => {
    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/availability',
    })

    const response = await getAvailability(request)

    await expectJsonResponse(response, 400, {
      error: 'Date is required',
    })
  })

  it('returns availability matrix for a date', async () => {
    const mockTimeSlots = [
      { slotTime: '09:00', label: '9:00 AM' },
      { slotTime: '09:30', label: '9:30 AM' },
      { slotTime: '15:00', label: '3:00 PM' },
    ]

    const mockCourts = [
      { id: 1, name: 'Court 1', isActive: true },
    ]

    vi.mocked(getCachedTimeSlots).mockResolvedValue(mockTimeSlots)
    vi.mocked(getCachedCourts).mockResolvedValue(mockCourts as never)
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])
    vi.mocked(prisma.recurringBooking.findMany).mockResolvedValue([])
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([])
    vi.mocked(shouldUseWeekendHours).mockReturnValue(true)
    vi.mocked(getHolidayName).mockReturnValue(null)
    vi.mocked(isTodayInMalaysia).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/availability',
      searchParams: {
        date: '2026-02-20',
      },
    })

    const response = await getAvailability(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.date).toBe('2026-02-20')
    expect(json.courts).toHaveLength(1)
    expect(json.availability).toHaveLength(1)
    expect(json.isWeekend).toBe(true)
  })

  it('filters slots based on weekday vs weekend', async () => {
    const mockTimeSlots = [
      { slotTime: '09:00', label: '9:00 AM' },
      { slotTime: '15:00', label: '3:00 PM' },
    ]

    vi.mocked(getCachedTimeSlots).mockResolvedValue(mockTimeSlots)
    vi.mocked(getCachedCourts).mockResolvedValue([{ id: 1, name: 'Court 1' }] as never)
    vi.mocked(prisma.booking.findMany).mockResolvedValue([])
    vi.mocked(prisma.recurringBooking.findMany).mockResolvedValue([])
    vi.mocked(prisma.lessonSession.findMany).mockResolvedValue([])
    vi.mocked(shouldUseWeekendHours).mockReturnValue(false)
    vi.mocked(getHolidayName).mockReturnValue(null)
    vi.mocked(isTodayInMalaysia).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/availability',
      searchParams: {
        date: '2026-02-17',
      },
    })

    const response = await getAvailability(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.timeSlots).toHaveLength(1)
    expect(json.timeSlots[0].slotTime).toBe('15:00')
  })
})

describe('GET /api/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when token is missing', async () => {
    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/verify-email',
    })

    const response = await verifyEmail(request)

    await expectJsonResponse(response, 400, {
      error: 'Verification token is required',
    })
  })

  it('redirects to profile with expired status when token is invalid', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/verify-email',
      searchParams: {
        token: 'invalid-token',
      },
    })

    const response = await verifyEmail(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('verify=expired')
  })

  it('redirects to profile with taken status when pending email is in use', async () => {
    const mockUser = {
      id: 'user-1',
      pendingEmail: 'new@example.com',
    }

    const existingUser = {
      id: 'user-2',
      email: 'new@example.com',
    }

    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/verify-email',
      searchParams: {
        token: 'valid-token',
      },
    })

    const response = await verifyEmail(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('verify=taken')
  })

  it('updates email and redirects to profile with success status', async () => {
    const mockUser = {
      id: 'user-1',
      pendingEmail: 'new@example.com',
    }

    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/verify-email',
      searchParams: {
        token: 'valid-token',
      },
    })

    const response = await verifyEmail(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('verify=success')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        email: 'new@example.com',
        pendingEmail: null,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    })
  })
})

// Note: Cron endpoint tests skipped - CRON_SECRET is imported as const before tests run.

describe('GET /api/admin/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const response = await getMembers()

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns members and non-members with BigInt UID serialization', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockUsers = [
      {
        id: 'user-1',
        uid: BigInt(1),
        name: 'Member One',
        email: 'member@test.com',
        phone: '0123456789',
        isMember: true,
        skillLevel: 'intermediate',
        createdAt: new Date(),
        _count: { lessonSessions: 5 },
      },
      {
        id: 'user-2',
        uid: BigInt(2),
        name: 'Non-Member',
        email: 'user@test.com',
        phone: '0198765432',
        isMember: false,
        skillLevel: null,
        createdAt: new Date(),
        _count: { lessonSessions: 0 },
      },
    ]

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)

    const response = await getMembers()

    const json = await expectJsonResponse(response, 200)

    expect(json.members).toHaveLength(1)
    expect(json.nonMembers).toHaveLength(1)
    expect(json.all).toHaveLength(2)
    expect(json.members[0].uid).toBe('001')
    expect(json.nonMembers[0].uid).toBe('002')
  })
})

describe('PATCH /api/admin/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/members',
      body: {
        userId: 'user-1',
        isMember: true,
      },
    })

    const response = await updateMember(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when userId is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/members',
      body: {
        isMember: true,
      },
    })

    const response = await updateMember(request)

    await expectJsonResponse(response, 400, {
      error: 'User ID is required',
    })
  })

  it('updates member status and clears skill level when removing membership', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockUpdatedUser = {
      id: 'user-1',
      uid: BigInt(1),
      name: 'Test User',
      email: 'test@example.com',
      phone: '0123456789',
      isMember: false,
      skillLevel: null,
    }

    vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/members',
      body: {
        userId: 'user-1',
        isMember: false,
      },
    })

    const response = await updateMember(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.user.isMember).toBe(false)
    expect(json.user.skillLevel).toBeNull()
    expect(json.user.uid).toBe('001')
  })
})

describe('GET /api/admin/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/accounts',
    })

    const response = await getAccounts(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns user accounts with spending calculations', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockUsers = [
      {
        id: 'user-1',
        uid: BigInt(1),
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        isAdmin: false,
        createdAt: new Date(),
        bookings: [
          {
            id: 'booking-1',
            bookingDate: new Date('2026-02-15'),
            startTime: '09:00',
            endTime: '10:00',
            totalAmount: 30,
            sport: 'badminton',
            status: 'confirmed',
            court: { name: 'Court 1' },
          },
        ],
        recurringBookings: [],
        _count: {
          bookings: 1,
          recurringBookings: 0,
        },
      },
    ]

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/accounts',
    })

    const response = await getAccounts(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.users).toHaveLength(1)
    expect(json.users[0].uid).toBe('001')
    expect(json.users[0].totalSpent).toBe(30)
    expect(json.users[0].regularBookings).toBe(1)
  })

  it('returns single user by UID', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockUser = {
      id: 'user-1',
      uid: BigInt(42),
      name: 'Test User',
      email: 'test@example.com',
      phone: '0123456789',
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/accounts',
      searchParams: {
        uid: '42',
      },
    })

    const response = await getAccounts(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.user.uid).toBe('042')
    expect(json.user.name).toBe('Test User')
  })
})

describe('POST /api/admin/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/accounts',
      body: {
        name: 'New User',
        phone: '0123456789',
      },
    })

    const response = await createAccount(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/accounts',
      body: {
        name: 'New User',
      },
    })

    const response = await createAccount(request)

    await expectJsonResponse(response, 400, {
      error: 'Name and phone are required',
    })
  })

  it('returns 400 when phone already exists', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing',
      phone: '0123456789',
    } as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/accounts',
      body: {
        name: 'New User',
        phone: '0123456789',
      },
    })

    const response = await createAccount(request)

    await expectJsonResponse(response, 400, {
      error: 'Phone number already registered',
    })
  })
})

describe('PATCH /api/admin/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/accounts',
      body: {
        userId: 'user-1',
        newUid: 99,
      },
    })

    const response = await updateAccountUid(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/accounts',
      body: {
        userId: 'user-1',
      },
    })

    const response = await updateAccountUid(request)

    await expectJsonResponse(response, 400, {
      error: 'User ID and new UID are required',
    })
  })

  it('returns 400 when UID is already in use', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'other-user',
      uid: BigInt(99),
    } as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/accounts',
      body: {
        userId: 'user-1',
        newUid: 99,
      },
    })

    const response = await updateAccountUid(request)

    await expectJsonResponse(response, 400, {
      error: 'UID is already in use by another user',
    })
  })
})

describe('GET /api/admin/trial-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trial-requests',
    })

    const response = await getTrialRequests(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns trial requests with status counts', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const mockRequests = [
      {
        id: 'request-1',
        name: 'Test User',
        phone: '0123456789',
        status: 'new',
        createdAt: new Date(),
      },
      {
        id: 'request-2',
        name: 'Test User 2',
        phone: '0198765432',
        status: 'contacted',
        createdAt: new Date(),
      },
    ]

    const mockCounts = [
      { status: 'new', _count: { status: 1 } },
      { status: 'contacted', _count: { status: 1 } },
    ]

    vi.mocked(prisma.trialRequest.findMany).mockResolvedValue(mockRequests as never)
    vi.mocked(prisma.trialRequest.groupBy).mockResolvedValue(mockCounts as never)

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trial-requests',
    })

    const response = await getTrialRequests(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.requests).toHaveLength(2)
    expect(json.counts.new).toBe(1)
    expect(json.counts.contacted).toBe(1)
    expect(json.total).toBe(2)
  })

  it('filters trial requests by status', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.trialRequest.findMany).mockResolvedValue([])
    vi.mocked(prisma.trialRequest.groupBy).mockResolvedValue([])

    const request = createMockNextRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/trial-requests',
      searchParams: {
        status: 'new',
      },
    })

    const response = await getTrialRequests(request)

    await expectJsonResponse(response, 200)

    expect(prisma.trialRequest.findMany).toHaveBeenCalledWith({
      where: { status: 'new' },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('PATCH /api/admin/trial-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/trial-requests',
      body: {
        id: 'request-1',
        status: 'contacted',
      },
    })

    const response = await updateTrialRequest(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when id is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/trial-requests',
      body: {
        status: 'contacted',
      },
    })

    const response = await updateTrialRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Request ID is required',
    })
  })

  it('updates trial request status and sets contactedAt when changing from new', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const existingRequest = {
      id: 'request-1',
      status: 'new',
    }

    const updatedRequest = {
      id: 'request-1',
      status: 'contacted',
      handledBy: 'admin@test.com',
      contactedAt: new Date(),
    }

    vi.mocked(prisma.trialRequest.findUnique).mockResolvedValue(existingRequest as never)
    vi.mocked(prisma.trialRequest.update).mockResolvedValue(updatedRequest as never)

    const request = createMockNextRequest({
      method: 'PATCH',
      url: 'http://localhost:3000/api/admin/trial-requests',
      body: {
        id: 'request-1',
        status: 'contacted',
      },
    })

    const response = await updateTrialRequest(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.request.status).toBe('contacted')
  })
})

describe('DELETE /api/admin/trial-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(isAdmin).mockReturnValue(false)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/trial-requests',
      searchParams: {
        id: 'request-1',
      },
    })

    const response = await deleteTrialRequest(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when id is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/trial-requests',
    })

    const response = await deleteTrialRequest(request)

    await expectJsonResponse(response, 400, {
      error: 'Request ID is required',
    })
  })

  it('deletes trial request successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.adminSession as never)
    vi.mocked(isAdmin).mockReturnValue(true)

    vi.mocked(prisma.trialRequest.delete).mockResolvedValue({} as never)

    const request = createMockNextRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/trial-requests',
      searchParams: {
        id: 'request-1',
      },
    })

    const response = await deleteTrialRequest(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.message).toBe('Trial request deleted')
    expect(prisma.trialRequest.delete).toHaveBeenCalledWith({
      where: { id: 'request-1' },
    })
  })
})
