// Job UID Generator for Stringing Orders
// Format: MON-###-YYYY (e.g., JAN-001-2026)
// Uses Malaysia Time (UTC+8) for month boundaries
// Race-condition safe using database transactions

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// Month abbreviations for Job UID format
const MONTH_ABBREV = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
]

/**
 * Get current date in Malaysia Time (UTC+8)
 */
function getMalaysiaDate(): Date {
  const now = new Date()
  // Convert to Malaysia time (UTC+8)
  const malaysiaOffset = 8 * 60 // 8 hours in minutes
  const utcOffset = now.getTimezoneOffset() // Local timezone offset in minutes
  const malaysiaTime = new Date(now.getTime() + (malaysiaOffset + utcOffset) * 60 * 1000)
  return malaysiaTime
}

/**
 * Format a Job UID from year, month, and counter
 */
function formatJobUid(year: number, month: number, counter: number): string {
  const monthAbbrev = MONTH_ABBREV[month - 1]
  const paddedCounter = counter.toString().padStart(3, '0')
  return `${monthAbbrev}-${paddedCounter}-${year}`
}

/**
 * Generate a unique Job UID using a transaction to prevent race conditions.
 * Uses optimistic locking with upsert to handle concurrent requests.
 *
 * @returns The generated Job UID in format MON-###-YYYY
 */
export async function generateJobUid(): Promise<string> {
  const malaysiaDate = getMalaysiaDate()
  const year = malaysiaDate.getFullYear()
  const month = malaysiaDate.getMonth() + 1 // JavaScript months are 0-indexed

  // Use a transaction with raw SQL for atomic counter increment
  // This prevents race conditions where two requests might get the same counter
  const result = await prisma.$transaction(async (tx) => {
    // First, try to upsert the counter row
    // Use raw SQL with ON CONFLICT DO UPDATE for atomic increment
    await tx.$executeRaw`
      INSERT INTO stringing_month_counters (id, year, month, counter)
      VALUES (gen_random_uuid()::text, ${year}, ${month}, 1)
      ON CONFLICT (year, month)
      DO UPDATE SET counter = stringing_month_counters.counter + 1
    `

    // Then fetch the current counter value
    const counterRow = await tx.stringingMonthCounter.findUnique({
      where: {
        year_month: { year, month }
      }
    })

    if (!counterRow) {
      throw new Error('Failed to generate Job UID: counter not found after upsert')
    }

    return counterRow.counter
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })

  return formatJobUid(year, month, result)
}

/**
 * Parse a Job UID into its components
 * @param jobUid - The Job UID string (e.g., "JAN-001-2026")
 * @returns Object with month, counter, and year, or null if invalid
 */
export function parseJobUid(jobUid: string): { month: string; counter: number; year: number } | null {
  const match = jobUid.match(/^([A-Z]{3})-(\d{3})-(\d{4})$/)
  if (!match) return null

  const [, month, counterStr, yearStr] = match
  const counter = parseInt(counterStr, 10)
  const year = parseInt(yearStr, 10)

  // Validate month abbreviation
  if (!MONTH_ABBREV.includes(month)) return null

  return { month, counter, year }
}

/**
 * Get the display status for tracking page
 */
export function getStatusDisplayInfo(status: string): {
  label: string
  step: number
  color: string
} {
  switch (status) {
    case 'RECEIVED':
      return { label: 'Received', step: 1, color: 'blue' }
    case 'IN_PROGRESS':
      return { label: 'In Progress', step: 2, color: 'yellow' }
    case 'READY':
      return { label: 'Ready for Pickup', step: 3, color: 'green' }
    case 'COLLECTED':
      return { label: 'Collected', step: 4, color: 'gray' }
    default:
      return { label: 'Unknown', step: 0, color: 'gray' }
  }
}

export const ORDER_STATUSES = ['RECEIVED', 'IN_PROGRESS', 'READY', 'COLLECTED'] as const
export type OrderStatus = typeof ORDER_STATUSES[number]
