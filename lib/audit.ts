import { prisma } from '@/lib/prisma'

interface AuditLogEntry {
  adminId: string
  adminEmail: string
  action: string
  targetType: string
  targetId?: string
  details?: Record<string, unknown> | null
  ipAddress?: string
}

/**
 * Log an admin action to the audit trail.
 * Fire-and-forget — errors are logged but don't break the request.
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: entry.adminId,
        adminEmail: entry.adminEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId || null,
        details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
        ipAddress: entry.ipAddress || null,
      },
    })
  } catch (error) {
    // Never let audit logging break the main request
    console.error('Audit log failed:', error)
  }
}
