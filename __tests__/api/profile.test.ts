import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getProfile, PATCH as updateProfile } from '@/app/api/profile/route'
import { POST as changePassword } from '@/app/api/profile/password/route'
import { POST as cancelBooking } from '@/app/api/profile/bookings/[id]/cancel/route'
import { POST as deleteAccount } from '@/app/api/profile/delete/route'
import { createMockNextRequest, expectJsonResponse, fixtures } from '../helpers/api-helpers'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    lessonSession: {
      updateMany: vi.fn(),
    },
    lessonRequest: {
      deleteMany: vi.fn(),
    },
    recurringBooking: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  getEmailVerificationEmail: vi.fn(() => ({
    subject: 'Verify your email',
    html: '<p>Verify</p>',
  })),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

vi.mock('date-fns', () => ({
  differenceInHours: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { differenceInHours } from 'date-fns'

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const response = await getProfile()

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 404 when user is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const response = await getProfile()

    await expectJsonResponse(response, 404, {
      error: 'User not found',
    })
  })

  it('returns user profile with formatted UID', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const mockUser = {
      id: 'user-1',
      uid: BigInt(42),
      name: 'Test User',
      email: 'test@example.com',
      phone: '0123456789',
      emergencyContact: '0198765432',
      creditBalance: 50,
      createdAt: new Date('2026-01-01'),
      isMember: false,
      notifyBookingConfirm: true,
      notifyBookingReminder: true,
      notifyCancellation: true,
      notifyLessonUpdates: false,
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)

    const response = await getProfile()

    const json = await expectJsonResponse(response, 200)

    expect(json.uid).toBe('042')
    expect(json.name).toBe('Test User')
    expect(json.email).toBe('test@example.com')
    expect(json.creditBalance).toBe(50)
  })
})

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    })

    const response = await updateProfile(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 404 when user is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    })

    const response = await updateProfile(request)

    await expectJsonResponse(response, 404, {
      error: 'User not found',
    })
  })

  it('returns 400 when email is already in use', async () => {
    const currentUser = {
      id: 'user-1',
      email: 'current@example.com',
      name: 'Current User',
      phone: '0123456789',
    }

    const existingUser = {
      id: 'user-2',
      email: 'taken@example.com',
    }

    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(currentUser as never)
      .mockResolvedValueOnce(existingUser as never)

    const request = new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'taken@example.com' }),
    })

    const response = await updateProfile(request)

    await expectJsonResponse(response, 400, {
      error: 'Email already in use',
    })
  })

  it('returns 400 when phone is already in use', async () => {
    const currentUser = {
      id: 'user-1',
      email: 'current@example.com',
      name: 'Current User',
      phone: '0123456789',
    }

    const existingUser = {
      id: 'user-2',
      phone: '0198765432',
    }

    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(currentUser as never)
      .mockResolvedValueOnce(existingUser as never)

    const request = new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '0198765432' }),
    })

    const response = await updateProfile(request)

    await expectJsonResponse(response, 400, {
      error: 'Phone number already in use',
    })
  })

  it('updates profile fields without email change', async () => {
    const currentUser = {
      id: 'user-1',
      uid: BigInt(1),
      email: 'current@example.com',
      name: 'Current User',
      phone: '0123456789',
      emergencyContact: null,
    }

    const updatedUser = {
      id: 'user-1',
      name: 'Updated Name',
      email: 'current@example.com',
      phone: '0198765432',
      emergencyContact: '0111111111',
      creditBalance: 0,
      createdAt: new Date('2026-01-01'),
    }

    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(currentUser as never)
      .mockResolvedValueOnce(null)
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as never)

    const request = new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Name',
        phone: '0198765432',
        emergencyContact: '0111111111',
      }),
    })

    const response = await updateProfile(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.name).toBe('Updated Name')
    expect(json.phone).toBe('0198765432')
    expect(json.emailVerificationSent).toBe(false)
  })

  it('sends verification email when email is changed', async () => {
    const currentUser = {
      id: 'user-1',
      uid: BigInt(1),
      email: 'current@example.com',
      name: 'Current User',
      phone: '0123456789',
    }

    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(currentUser as never)
      .mockResolvedValueOnce(null)

    vi.mocked(prisma.user.update)
      .mockResolvedValueOnce({
        id: 'user-1',
        pendingEmail: 'new@example.com',
      } as never)
      .mockResolvedValueOnce({
        id: 'user-1',
        name: 'Current User',
        email: 'current@example.com',
        phone: '0123456789',
        emergencyContact: null,
        creditBalance: 0,
        createdAt: new Date('2026-01-01'),
      } as never)

    vi.mocked(sendEmail).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        email: 'new@example.com',
      }),
    })

    const response = await updateProfile(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.emailVerificationSent).toBe(true)
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'new@example.com',
      subject: 'Verify your email',
      html: '<p>Verify</p>',
    })
  })
})

describe('POST /api/profile/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      }),
    })

    const response = await changePassword(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const request = new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass',
      }),
    })

    const response = await changePassword(request)

    await expectJsonResponse(response, 400, {
      error: 'Missing required fields',
    })
  })

  it('returns 400 when new password is too short', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const request = new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass',
        newPassword: 'short',
      }),
    })

    const response = await changePassword(request)

    await expectJsonResponse(response, 400, {
      error: 'Password must be at least 8 characters',
    })
  })

  it('returns 404 when user is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      }),
    })

    const response = await changePassword(request)

    await expectJsonResponse(response, 404, {
      error: 'User not found',
    })
  })

  it('returns 400 when current password is incorrect', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
    } as never)

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const request = new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
      }),
    })

    const response = await changePassword(request)

    await expectJsonResponse(response, 400, {
      error: 'Current password is incorrect',
    })
  })

  it('changes password successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'old-hash',
    } as never)

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const request = new Request('http://localhost:3000/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      }),
    })

    const response = await changePassword(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 12)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'new-hash' },
    })
  })
})

describe('POST /api/profile/bookings/[id]/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/bookings/booking-1/cancel', {
      method: 'POST',
    })

    const response = await cancelBooking(request, {
      params: Promise.resolve({ id: 'booking-1' }),
    })

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 404 when booking is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/bookings/nonexistent/cancel', {
      method: 'POST',
    })

    const response = await cancelBooking(request, {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    await expectJsonResponse(response, 404, {
      error: 'Booking not found',
    })
  })

  it('returns 403 when user does not own the booking', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: 'booking-1',
      userId: 'other-user',
      status: 'confirmed',
    } as never)

    const request = new Request('http://localhost:3000/api/profile/bookings/booking-1/cancel', {
      method: 'POST',
    })

    const response = await cancelBooking(request, {
      params: Promise.resolve({ id: 'booking-1' }),
    })

    await expectJsonResponse(response, 403, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when booking is already cancelled', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'cancelled',
    } as never)

    const request = new Request('http://localhost:3000/api/profile/bookings/booking-1/cancel', {
      method: 'POST',
    })

    const response = await cancelBooking(request, {
      params: Promise.resolve({ id: 'booking-1' }),
    })

    await expectJsonResponse(response, 400, {
      error: 'Booking is already cancelled',
    })
  })

  it('returns 400 when cancelling within 24 hours', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'confirmed',
      bookingDate: new Date('2026-02-20'),
      startTime: '09:00',
      totalAmount: 15,
    } as never)

    vi.mocked(differenceInHours).mockReturnValue(12)

    const request = new Request('http://localhost:3000/api/profile/bookings/booking-1/cancel', {
      method: 'POST',
    })

    const response = await cancelBooking(request, {
      params: Promise.resolve({ id: 'booking-1' }),
    })

    await expectJsonResponse(response, 400, {
      error: 'Cannot cancel bookings within 24 hours of start time',
    })
  })

  it('cancels booking and adds credit successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: 'booking-1',
      userId: 'user-1',
      status: 'confirmed',
      bookingDate: new Date('2026-02-25'),
      startTime: '09:00',
      totalAmount: 30,
    } as never)

    vi.mocked(differenceInHours).mockReturnValue(48)
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never)

    const request = new Request('http://localhost:3000/api/profile/bookings/booking-1/cancel', {
      method: 'POST',
    })

    const response = await cancelBooking(request, {
      params: Promise.resolve({ id: 'booking-1' }),
    })

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(json.creditAdded).toBe(30)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

describe('POST /api/profile/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/delete', {
      method: 'POST',
      body: JSON.stringify({ password: 'mypassword' }),
    })

    const response = await deleteAccount(request)

    await expectJsonResponse(response, 401, {
      error: 'Unauthorized',
    })
  })

  it('returns 400 when password is missing', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)

    const request = new Request('http://localhost:3000/api/profile/delete', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await deleteAccount(request)

    await expectJsonResponse(response, 400, {
      error: 'Password is required',
    })
  })

  it('returns 404 when user is not found', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/delete', {
      method: 'POST',
      body: JSON.stringify({ password: 'mypassword' }),
    })

    const response = await deleteAccount(request)

    await expectJsonResponse(response, 404, {
      error: 'User not found',
    })
  })

  it('returns 400 when password is incorrect', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
    } as never)

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const request = new Request('http://localhost:3000/api/profile/delete', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrongpassword' }),
    })

    const response = await deleteAccount(request)

    await expectJsonResponse(response, 400, {
      error: 'Incorrect password',
    })
  })

  it('soft deletes account successfully', async () => {
    vi.mocked(auth).mockResolvedValue(fixtures.userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
    } as never)

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}, {}, {}] as never)

    const request = new Request('http://localhost:3000/api/profile/delete', {
      method: 'POST',
      body: JSON.stringify({ password: 'correctpassword' }),
    })

    const response = await deleteAccount(request)

    const json = await expectJsonResponse(response, 200)

    expect(json.success).toBe(true)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
