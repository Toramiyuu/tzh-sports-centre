import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const queryDate = new Date(date)
    const dayOfWeek = queryDate.getDay() // 0=Sunday, 1=Monday, etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday

    // Get all time slots
    const allTimeSlots = await prisma.timeSlot.findMany({
      orderBy: { id: 'asc' },
    })

    // Filter time slots based on day of week:
    // - Weekdays (Mon-Fri): 3 PM (15:00) to 12 AM
    // - Weekends (Sat-Sun): 9 AM (09:00) to 12 AM
    const startTimeFilter = isWeekend ? '09:00' : '15:00'
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
      isWeekend,
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
