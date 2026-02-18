import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/register/route'
import { createMockNextRequest, expectJsonResponse } from '../helpers/api-helpers'
import { buildUser } from '../helpers/factories'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  RATE_LIMITS: {
    register: { maxAttempts: 5, windowMs: 900000 },
  },
}))

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1')
    vi.mocked(checkRateLimit).mockReturnValue({ success: true })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
    vi.mocked(bcrypt.hash).mockResolvedValue('$2a$12$hashedpassword')
  })

  it('returns 429 when rate limit exceeded', async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ success: false })

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 429, {
      error: 'Too many attempts. Please try again later.',
    })
  })

  it('returns 400 when name is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        email: 'test@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Name, email, phone, and password are required',
    })
  })

  it('returns 400 when email is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Name, email, phone, and password are required',
    })
  })

  it('returns 400 when password is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Name, email, phone, and password are required',
    })
  })

  it('returns 400 when phone is missing', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Name, email, phone, and password are required',
    })
  })

  it('returns 400 when email is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid email format',
    })
  })

  it('returns 400 when phone is invalid', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: 'invalid-phone',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Invalid phone number format. Please use a valid Malaysian phone number.',
    })
  })

  it('returns 400 when password is too short', async () => {
    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 400, {
      error: 'Password must be at least 8 characters',
    })
  })

  it('returns 409 when email is already registered', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      buildUser({ email: 'test@example.com' }) as never
    )

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'Email already registered',
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
  })

  it('returns 409 when phone is already registered', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildUser({ phone: '0123456789' }) as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    await expectJsonResponse(response, 409, {
      error: 'Phone number already registered',
    })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { phone: '0123456789' },
    })
  })

  it('creates user with hashed password and returns 201', async () => {
    const newUser = {
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
    }

    vi.mocked(prisma.user.create).mockResolvedValue(newUser as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    const response = await POST(request)

    const json = await expectJsonResponse(response, 201, {
      message: 'User created successfully',
    })

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: '$2a$12$hashedpassword',
        phone: '0123456789',
        uid: BigInt(1),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    expect(json.user).toMatchObject({
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
    })
  })

  it('generates UID starting from 1 when no users exist', async () => {
    const newUser = {
      id: 'new-user-id',
      name: 'First User',
      email: 'first@example.com',
    }

    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(newUser as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'First User',
        email: 'first@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    await POST(request)

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uid: BigInt(1),
        }),
      })
    )
  })

  it('generates incremented UID when users exist', async () => {
    const existingUser = { uid: BigInt(5) }
    const newUser = {
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
    }

    vi.mocked(prisma.user.findFirst).mockResolvedValue(existingUser as never)
    vi.mocked(prisma.user.create).mockResolvedValue(newUser as never)

    const request = createMockNextRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/register',
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '0123456789',
      },
    })

    await POST(request)

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      select: { uid: true },
      orderBy: { uid: 'desc' },
    })

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          uid: BigInt(6),
        }),
      })
    )
  })
})
