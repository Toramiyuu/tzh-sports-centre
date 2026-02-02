import { PrismaClient } from '@prisma/client'

// Peak hour pricing constants
export const BADMINTON_RATE = 15        // RM15/hr before 6 PM
export const BADMINTON_PEAK_RATE = 18   // RM18/hr 6 PM onwards
export const PICKLEBALL_RATE = 25       // RM25/hr all times
export const PEAK_MINUTES = 18 * 60     // 6 PM in minutes

// Calculate hours from time range, handles midnight crossover (e.g. 21:00-00:00)
export function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin
  if (endMinutes <= startMinutes) endMinutes += 24 * 60
  return (endMinutes - startMinutes) / 60
}

// Calculate booking amount with peak hour support
// Handles bookings that cross the 6 PM boundary and midnight crossover
export function calculateBookingAmount(startTime: string, endTime: string, sport: string): number {
  const hours = calculateHours(startTime, endTime)

  if (sport.toLowerCase() === 'pickleball') {
    return hours * PICKLEBALL_RATE
  }

  // Badminton: check if booking crosses 6 PM
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin
  if (endMinutes <= startMinutes) endMinutes += 24 * 60

  if (endMinutes <= PEAK_MINUTES) {
    return hours * BADMINTON_RATE
  } else if (startMinutes >= PEAK_MINUTES) {
    return hours * BADMINTON_PEAK_RATE
  } else {
    const hoursBeforePeak = (PEAK_MINUTES - startMinutes) / 60
    const hoursAfterPeak = (endMinutes - PEAK_MINUTES) / 60
    return (hoursBeforePeak * BADMINTON_RATE) + (hoursAfterPeak * BADMINTON_PEAK_RATE)
  }
}

// Get hourly rate based on sport and time (for display purposes)
export function getSportRate(sport: string, startTime?: string): number {
  if (sport.toLowerCase() === 'pickleball') return PICKLEBALL_RATE
  if (startTime && startTime >= '18:00') return BADMINTON_PEAK_RATE
  return BADMINTON_RATE
}

// Count sessions in a month for a given day of week
export function countSessionsInMonth(year: number, month: number, dayOfWeek: number): number {
  let count = 0
  const date = new Date(year, month - 1, 1) // month is 0-indexed in Date constructor
  while (date.getMonth() === month - 1) {
    if (date.getDay() === dayOfWeek) {
      count++
    }
    date.setDate(date.getDate() + 1)
  }
  return count
}

// Types for grouped recurring bookings
export interface RecurringSlot {
  id: string
  courtId: number
  sport: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startDate: Date
  endDate: Date | null
  label: string | null
  userId: string | null
  guestName: string | null
  guestPhone: string | null
  hourlyRate: number | null
  isActive: boolean
  court: { id: number; name: string; hourlyRate: number }
  payments?: Array<{
    id: string
    month: number
    year: number
    amount: number
    sessionsCount: number
    status: string
    paidAt: Date | null
    paymentMethod: string | null
    notes: string | null
  }>
}

export interface GroupedRecurringBooking {
  slotIds: string[]
  userId: string | null
  guestName: string | null
  guestPhone: string | null
  dayOfWeek: number
  courtId: number
  courtName: string
  sport: string
  startTime: string
  endTime: string
  duration: number
  label: string | null
  isActive: boolean
  hourlyRate: number | null
  startDate: Date
  endDate: Date | null
  amountPerSession: number
  slots: RecurringSlot[]
}

// Group 30-min slot records into logical bookings
// Groups by (userId/guestName, dayOfWeek, courtId) with contiguous time check
// Slots must form an unbroken chain (end of one = start of next) to be grouped
export function groupRecurringSlots(slots: RecurringSlot[]): GroupedRecurringBooking[] {
  // Sort by dayOfWeek, courtId, startTime for consistent grouping
  const sorted = [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
    if (a.courtId !== b.courtId) return a.courtId - b.courtId
    // Sort by user/guest identity
    const aKey = a.userId || a.guestName || ''
    const bKey = b.userId || b.guestName || ''
    if (aKey !== bKey) return aKey.localeCompare(bKey)
    return a.startTime.localeCompare(b.startTime)
  })

  const groups: GroupedRecurringBooking[] = []
  let currentGroup: RecurringSlot[] | null = null

  for (const slot of sorted) {
    const slotKey = `${slot.userId || slot.guestName || 'unknown'}-${slot.dayOfWeek}-${slot.courtId}`

    if (currentGroup) {
      const lastSlot = currentGroup[currentGroup.length - 1]
      const lastKey = `${lastSlot.userId || lastSlot.guestName || 'unknown'}-${lastSlot.dayOfWeek}-${lastSlot.courtId}`

      // Check contiguous: last slot's endTime must equal this slot's startTime
      if (lastKey === slotKey && lastSlot.endTime === slot.startTime && lastSlot.isActive === slot.isActive) {
        currentGroup.push(slot)
        continue
      }
    }

    // Finalize previous group if exists
    if (currentGroup && currentGroup.length > 0) {
      groups.push(buildGroup(currentGroup))
    }

    // Start new group
    currentGroup = [slot]
  }

  // Don't forget the last group
  if (currentGroup && currentGroup.length > 0) {
    groups.push(buildGroup(currentGroup))
  }

  return groups
}

function buildGroup(slots: RecurringSlot[]): GroupedRecurringBooking {
  const first = slots[0]
  const last = slots[slots.length - 1]
  const startTime = first.startTime
  const endTime = last.endTime
  const duration = calculateHours(startTime, endTime)

  // Calculate amount per session using custom rate or peak-hour pricing
  const amountPerSession = first.hourlyRate
    ? duration * first.hourlyRate
    : calculateBookingAmount(startTime, endTime, first.sport)

  return {
    slotIds: slots.map(s => s.id),
    userId: first.userId,
    guestName: first.guestName,
    guestPhone: first.guestPhone,
    dayOfWeek: first.dayOfWeek,
    courtId: first.courtId,
    courtName: first.court.name,
    sport: first.sport,
    startTime,
    endTime,
    duration,
    label: first.label,
    isActive: first.isActive,
    hourlyRate: first.hourlyRate,
    startDate: first.startDate,
    endDate: first.endDate,
    amountPerSession,
    slots,
  }
}

// Auto-generate missing payment records for recurring bookings
// Uses upsert with unique constraint (recurringBookingId, month, year) for safety
// Sequential for Neon compatibility
export async function ensurePaymentRecords(
  prisma: PrismaClient,
  recurringBookingIds: string[],
  month: number,
  year: number
): Promise<void> {
  for (const recurringBookingId of recurringBookingIds) {
    const booking = await prisma.recurringBooking.findUnique({
      where: { id: recurringBookingId },
      include: { court: true },
    })

    if (!booking || !booking.isActive) continue

    const sessionsCount = countSessionsInMonth(year, month, booking.dayOfWeek)
    const hours = calculateHours(booking.startTime, booking.endTime)
    const hourlyRate = booking.hourlyRate || booking.court.hourlyRate
    const amount = sessionsCount * hours * hourlyRate

    await prisma.recurringBookingPayment.upsert({
      where: {
        recurringBookingId_month_year: {
          recurringBookingId,
          month,
          year,
        },
      },
      update: {}, // Don't overwrite existing records
      create: {
        recurringBookingId,
        month,
        year,
        amount,
        sessionsCount,
        status: 'pending',
      },
    })
  }
}

// Get payment status with overdue detection
export function getPaymentStatus(
  status: string,
  paymentMonth: number,
  paymentYear: number
): 'paid' | 'unpaid' | 'overdue' {
  if (status === 'paid') return 'paid'

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // If pending and month/year is before current month, it's overdue
  if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
    return 'overdue'
  }

  return 'unpaid'
}
