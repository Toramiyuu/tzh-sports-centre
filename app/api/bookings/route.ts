import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// GET - Fetch user's bookings
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        court: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST - Create a new booking (guest, logged-in user, or admin test)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { slots, date, sport, isTestBooking, isGuestBooking, guestName, guestPhone, guestEmail, payAtCounter } = body

    // Validate common required fields
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: 'No slots selected' },
        { status: 400 }
      )
    }

    if (!date || !sport) {
      return NextResponse.json(
        { error: 'Date and sport are required' },
        { status: 400 }
      )
    }

    // Determine booking type and validate accordingly
    let userId: string | null = null
    let bookingGuestName: string | null = null
    let bookingGuestPhone: string | null = null
    let bookingGuestEmail: string | null = null
    let bookingStatus = 'pending'
    let paymentStatus = 'pending'

    if (isGuestBooking) {
      // Guest booking - no login required
      if (!guestName) {
        return NextResponse.json(
          { error: 'Name is required for guest bookings' },
          { status: 400 }
        )
      }
      bookingGuestName = guestName
      bookingGuestPhone = guestPhone || null
      bookingGuestEmail = guestEmail || null

      // If paying at counter, confirm the booking immediately
      if (payAtCounter) {
        bookingStatus = 'confirmed'
        paymentStatus = 'pending' // Will pay at counter
      }
      // Otherwise, booking stays pending until online payment completes
    } else if (isTestBooking) {
      // Admin test booking
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      if (!isAdmin(session.user.email)) {
        return NextResponse.json(
          { error: 'Only admins can create test bookings' },
          { status: 403 }
        )
      }
      userId = session.user.id
      bookingStatus = 'confirmed'
      paymentStatus = 'paid' // Test bookings are free
    } else {
      // Regular logged-in user booking
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Please log in or book as a guest' },
          { status: 401 }
        )
      }
      userId = session.user.id
      // Booking stays pending until payment completes
      bookingStatus = 'pending'
      paymentStatus = 'pending'
    }

    const bookingDate = new Date(date)
    const dayOfWeek = bookingDate.getDay()

    // Check for conflicts - any existing booking for these court/time combinations
    const existingBookings = await prisma.booking.findMany({
      where: {
        bookingDate,
        status: { in: ['pending', 'confirmed'] },
        OR: slots.map((slot: { courtId: number; slotTime: string }) => ({
          courtId: slot.courtId,
          startTime: slot.slotTime,
        })),
      },
    })

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'One or more slots are no longer available' },
        { status: 409 }
      )
    }

    // Check for recurring booking conflicts
    const recurringConflicts = await prisma.recurringBooking.findMany({
      where: {
        dayOfWeek,
        isActive: true,
        startDate: { lte: bookingDate },
        OR: [
          { endDate: null },
          { endDate: { gte: bookingDate } },
        ],
      },
    })

    const recurringSlotSet = new Set(
      recurringConflicts.map(r => `${r.courtId}-${r.startTime}`)
    )

    const hasRecurringConflict = slots.some(
      (slot: { courtId: number; slotTime: string }) =>
        recurringSlotSet.has(`${slot.courtId}-${slot.slotTime}`)
    )

    if (hasRecurringConflict) {
      return NextResponse.json(
        { error: 'One or more slots conflict with a recurring booking' },
        { status: 409 }
      )
    }

    // Check for lesson session conflicts
    const lessonSessions = await prisma.lessonSession.findMany({
      where: {
        lessonDate: bookingDate,
        status: 'scheduled',
      },
      select: {
        courtId: true,
        startTime: true,
        endTime: true,
      },
    })

    // Build a set of all slots occupied by lessons
    const lessonSlotSet = new Set<string>()
    const timeSlots = await prisma.timeSlot.findMany({ orderBy: { id: 'asc' } })
    const allSlotTimes = timeSlots.map(s => s.slotTime)

    lessonSessions.forEach((lesson) => {
      const startIdx = allSlotTimes.indexOf(lesson.startTime)
      const endIdx = allSlotTimes.indexOf(lesson.endTime)
      if (startIdx !== -1) {
        const endIndex = endIdx !== -1 ? endIdx : allSlotTimes.length
        for (let i = startIdx; i < endIndex; i++) {
          lessonSlotSet.add(`${lesson.courtId}-${allSlotTimes[i]}`)
        }
      }
    })

    const hasLessonConflict = slots.some(
      (slot: { courtId: number; slotTime: string }) =>
        lessonSlotSet.has(`${slot.courtId}-${slot.slotTime}`)
    )

    if (hasLessonConflict) {
      return NextResponse.json(
        { error: 'One or more slots conflict with a scheduled lesson' },
        { status: 409 }
      )
    }

    // Create bookings for each slot (each slot is 30 minutes)
    const createdBookings = await prisma.$transaction(
      slots.map((slot: { courtId: number; slotTime: string; slotRate: number }) =>
        prisma.booking.create({
          data: {
            userId,
            courtId: slot.courtId,
            sport,
            bookingDate,
            startTime: slot.slotTime,
            endTime: getEndTime(slot.slotTime),
            totalAmount: slot.slotRate,
            status: bookingStatus,
            paymentStatus,
            guestName: bookingGuestName,
            guestPhone: bookingGuestPhone,
            guestEmail: bookingGuestEmail,
          },
          include: {
            court: true,
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        bookings: createdBookings,
        bookingIds: createdBookings.map(b => b.id),
        count: createdBookings.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

// Helper to calculate end time (30 minutes after start)
function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  let endMinutes = minutes + 30
  let endHours = hours
  if (endMinutes >= 60) {
    endMinutes = 0
    endHours = hours + 1
  }
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}
