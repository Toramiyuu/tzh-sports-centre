import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldUseWeekendHours, getHolidayName } from '@/lib/holidays'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const courtId = searchParams.get('courtId')

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    // Note: Expiration check is handled by cron job every hour
    // The booking query below already filters out expired bookings

    const queryDate = new Date(date)
    const dayOfWeek = queryDate.getDay() // 0=Sunday, 1=Monday, etc.

    // Check if weekend OR public holiday (both use weekend hours: 9 AM - 12 AM)
    const useWeekendHours = shouldUseWeekendHours(queryDate)
    const holidayName = getHolidayName(queryDate)

    // Get all time slots
    const allTimeSlots = await prisma.timeSlot.findMany({
      orderBy: { id: 'asc' },
    })

    // Filter time slots based on day type:
    // - Weekdays (Mon-Fri, non-holiday): 3 PM (15:00) to 12 AM
    // - Weekends & Public Holidays: 9 AM (09:00) to 12 AM
    const startTimeFilter = useWeekendHours ? '09:00' : '15:00'
    const timeSlots = allTimeSlots.filter(slot => slot.slotTime >= startTimeFilter)

    // Get existing bookings for the date
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: queryDate,
        status: { in: ['pending', 'confirmed'] },
        ...(courtId ? { courtId: parseInt(courtId) } : {}),
      },
      select: {
        courtId: true,
        startTime: true,
      },
    })

    // Get recurring bookings that apply to this day of week
    const recurringBookings = await prisma.recurringBooking.findMany({
      where: {
        dayOfWeek,
        isActive: true,
        startDate: { lte: queryDate },
        OR: [
          { endDate: null },
          { endDate: { gte: queryDate } },
        ],
        ...(courtId ? { courtId: parseInt(courtId) } : {}),
      },
      select: {
        courtId: true,
        startTime: true,
        label: true,
      },
    })

    // Get lesson sessions for the date
    const lessonSessions = await prisma.lessonSession.findMany({
      where: {
        lessonDate: queryDate,
        status: 'scheduled',
        ...(courtId ? { courtId: parseInt(courtId) } : {}),
      },
      select: {
        courtId: true,
        startTime: true,
        endTime: true,
      },
    })

    // Create a set of booked slots per court
    const bookedSlots: Record<number, Set<string>> = {}

    // Add regular bookings
    bookings.forEach((booking) => {
      if (!bookedSlots[booking.courtId]) {
        bookedSlots[booking.courtId] = new Set()
      }
      bookedSlots[booking.courtId].add(booking.startTime)
    })

    // Add recurring bookings
    recurringBookings.forEach((recurring) => {
      if (!bookedSlots[recurring.courtId]) {
        bookedSlots[recurring.courtId] = new Set()
      }
      bookedSlots[recurring.courtId].add(recurring.startTime)
    })

    // Add lesson sessions (mark all 30-min slots within the lesson duration)
    lessonSessions.forEach((lesson) => {
      if (!bookedSlots[lesson.courtId]) {
        bookedSlots[lesson.courtId] = new Set()
      }
      // Find all 30-min slots between startTime and endTime
      const allSlots = allTimeSlots.map(s => s.slotTime)
      const startIdx = allSlots.indexOf(lesson.startTime)
      const endIdx = allSlots.indexOf(lesson.endTime)
      if (startIdx !== -1) {
        const endIndex = endIdx !== -1 ? endIdx : allSlots.length
        for (let i = startIdx; i < endIndex; i++) {
          bookedSlots[lesson.courtId].add(allSlots[i])
        }
      }
    })

    // Create a map of recurring booking labels for display
    const recurringLabels: Record<string, string> = {}
    recurringBookings.forEach((recurring) => {
      if (recurring.label) {
        const key = `${recurring.courtId}-${recurring.startTime}`
        recurringLabels[key] = recurring.label
      }
    })

    // Get courts
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    })

    // Build availability matrix
    const availability = courts.map((court) => ({
      court,
      slots: timeSlots.map((slot) => {
        const key = `${court.id}-${slot.slotTime}`
        return {
          ...slot,
          available: !bookedSlots[court.id]?.has(slot.slotTime),
          recurringLabel: recurringLabels[key] || null,
        }
      }),
    }))

    return NextResponse.json({
      date,
      dayOfWeek,
      isWeekend: useWeekendHours,
      holidayName,
      timeSlots,
      courts,
      availability,
      recurringLabels,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
