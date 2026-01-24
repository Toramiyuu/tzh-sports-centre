// Job UID Generator for Stringing Orders
// Format: MON-###-YYYY (e.g., JAN-001-2026)
// Uses Malaysia Time (UTC+8) for month boundaries
// Race-condition safe using database transactions

import { prisma } from './prisma'

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
 * Generate a unique Job UID using atomic SQL to prevent race conditions.
 * Uses INSERT ... ON CONFLICT with RETURNING for a single atomic operation.
 * Retries on serialization failures.
 *
 * @returns The generated Job UID in format MON-###-YYYY
 */
export async function generateJobUid(): Promise<string> {
  const malaysiaDate = getMalaysiaDate()
  const year = malaysiaDate.getFullYear()
  const month = malaysiaDate.getMonth() + 1 // JavaScript months are 0-indexed

  const maxRetries = 3
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Atomic upsert + fetch in a single transaction
      const result = await prisma.$transaction(async (tx) => {
        // Upsert: insert with counter=1, or increment existing counter
        await tx.$executeRaw`
          INSERT INTO stringing_month_counters (id, year, month, counter)
          VALUES (gen_random_uuid()::text, ${year}, ${month}, 1)
          ON CONFLICT (year, month)
          DO UPDATE SET counter = stringing_month_counters.counter + 1
        `

        // Fetch the updated counter value
        const rows = await tx.$queryRaw<{ counter: number }[]>`
          SELECT counter FROM stringing_month_counters
          WHERE year = ${year} AND month = ${month}
        `

        if (!rows || rows.length === 0) {
          throw new Error('Failed to generate Job UID: counter not found after upsert')
        }

        return rows[0].counter
      })

      return formatJobUid(year, month, result)
    } catch (error) {
      // Retry on serialization/deadlock errors
      if (attempt < maxRetries - 1 && error instanceof Error &&
          (error.message.includes('serialization') || error.message.includes('deadlock'))) {
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
        continue
      }
      throw error
    }
  }

  throw new Error('Failed to generate Job UID after retries')
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
