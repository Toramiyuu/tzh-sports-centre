import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAdminAction } from '@/lib/audit'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates audit log with all required fields', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)

    await logAdminAction({
      adminId: 'admin-123',
      adminEmail: 'admin@example.com',
      action: 'DELETE_BOOKING',
      targetType: 'booking',
      targetId: 'booking-456',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-123',
        adminEmail: 'admin@example.com',
        action: 'DELETE_BOOKING',
        targetType: 'booking',
        targetId: 'booking-456',
        details: undefined,
        ipAddress: null,
      },
    })
  })

  it('handles optional fields correctly', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)

    await logAdminAction({
      adminId: 'admin-123',
      adminEmail: 'admin@example.com',
      action: 'UPDATE_USER',
      targetType: 'user',
      targetId: 'user-789',
      details: { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' },
      ipAddress: '192.168.1.1',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-123',
        adminEmail: 'admin@example.com',
        action: 'UPDATE_USER',
        targetType: 'user',
        targetId: 'user-789',
        details: { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' },
        ipAddress: '192.168.1.1',
      },
    })
  })

  it('converts undefined targetId to null', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)

    await logAdminAction({
      adminId: 'admin-123',
      adminEmail: 'admin@example.com',
      action: 'BULK_OPERATION',
      targetType: 'booking',
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetId: null,
      }),
    })
  })

  it('handles database errors gracefully without throwing', async () => {
    const testError = new Error('Database connection failed')
    vi.mocked(prisma.auditLog.create).mockRejectedValue(testError)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(logAdminAction({
      adminId: 'admin-123',
      adminEmail: 'admin@example.com',
      action: 'DELETE_BOOKING',
      targetType: 'booking',
    })).resolves.toBeUndefined()

    expect(consoleErrorSpy).toHaveBeenCalledWith('Audit log failed:', testError)

    consoleErrorSpy.mockRestore()
  })

  it('serializes complex details object', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)

    const complexDetails = {
      nested: { data: { value: 123 } },
      array: [1, 2, 3],
      string: 'test',
    }

    await logAdminAction({
      adminId: 'admin-123',
      adminEmail: 'admin@example.com',
      action: 'COMPLEX_OPERATION',
      targetType: 'system',
      details: complexDetails,
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: complexDetails,
      }),
    })
  })

  it('handles null details correctly', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)

    await logAdminAction({
      adminId: 'admin-123',
      adminEmail: 'admin@example.com',
      action: 'SIMPLE_ACTION',
      targetType: 'user',
      details: null,
    })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: undefined,
      }),
    })
  })
})
