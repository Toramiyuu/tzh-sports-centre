import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { calculateBookingAmount } from '@/lib/recurring-booking-utils'

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
    const { slots, date, sport, isTestBooking, isGuestBooking, guestName, guestPhone, guestEmail, payAtCounter, paymentMethod, paymentUserConfirmed, receiptUrl } = body

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

    if (isGuestBooking || paymentMethod === 'tng' || paymentMethod === 'duitnow') {
      // Guest booking or TNG payment - no login required for guests
      if (!guestName && !session?.user?.name) {
        return NextResponse.json(
          { error: 'Name is required for bookings' },
          { status: 400 }
        )
      }

      // Phone is required for guest/TNG bookings for contact purposes
      const phone = guestPhone?.trim() || null
      if (!phone && !session?.user?.id) {
        return NextResponse.json(
          { error: 'Phone number is required for guest bookings' },
          { status: 400 }
        )
      }

      bookingGuestName = guestName?.trim() || session?.user?.name || null
      bookingGuestPhone = phone
      bookingGuestEmail = guestEmail?.trim() || session?.user?.email || null

      // Set userId if logged in
      if (session?.user?.id) {
        userId = session.user.id
      }

      // If paying at counter, TNG, or DuitNow, confirm the booking but mark payment as pending
      if (payAtCounter || paymentMethod === 'tng' || paymentMethod === 'duitnow') {
        bookingStatus = 'confirmed'
        paymentStatus = 'pending' // Will pay at counter or via QR payment (manual verification)
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
      if (!session.user.email || !isAdmin(session.user.email)) {
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

    // Check all conflicts in parallel for performance
    const [existingBookings, recurringConflicts, lessonSessions] = await Promise.all([
      prisma.booking.findMany({
        where: {
          bookingDate,
          status: { in: ['pending', 'confirmed'] },
          OR: slots.map((slot: { courtId: number; slotTime: string }) => ({
            courtId: slot.courtId,
            startTime: slot.slotTime,
          })),
        },
      }),
      prisma.recurringBooking.findMany({
        where: {
          dayOfWeek,
          isActive: true,
          startDate: { lte: bookingDate },
          OR: [
            { endDate: null },
            { endDate: { gte: bookingDate } },
          ],
        },
      }),
      prisma.lessonSession.findMany({
        where: {
          lessonDate: bookingDate,
          status: 'scheduled',
        },
        select: {
          courtId: true,
          startTime: true,
          endTime: true,
        },
      }),
    ])

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'One or more slots are no longer available' },
        { status: 409 }
      )
    }

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

    // Check for lesson conflicts using time overlap (lessons may not align with 30-min slot grid)
    const hasLessonConflict = slots.some(
      (slot: { courtId: number; slotTime: string }) => {
        const slotEnd = getEndTime(slot.slotTime)
        return lessonSessions.some(
          (lesson) =>
            lesson.courtId === slot.courtId &&
            timeToMinutes(slot.slotTime) < timeToMinutes(lesson.endTime) &&
            timeToMinutes(slotEnd) > timeToMinutes(lesson.startTime)
        )
      }
    )

    if (hasLessonConflict) {
      return NextResponse.json(
        { error: 'One or more slots conflict with a scheduled lesson' },
        { status: 409 }
      )
    }

    // Create bookings for each slot sequentially (works with Neon pooler)
    const createdBookings = []
    for (const slot of slots as { courtId: number; slotTime: string }[]) {
      const endTime = getEndTime(slot.slotTime)
      const totalAmount = calculateBookingAmount(slot.slotTime, endTime, sport)
      try {
        const booking = await prisma.booking.create({
          data: {
            userId,
            courtId: slot.courtId,
            sport,
            bookingDate,
            startTime: slot.slotTime,
            endTime,
            totalAmount,
            status: bookingStatus,
            paymentStatus,
            paymentMethod: paymentMethod || null,
            paymentUserConfirmed: paymentUserConfirmed || false,
            paymentScreenshotUrl: receiptUrl || null,
            guestName: bookingGuestName,
            guestPhone: bookingGuestPhone,
            guestEmail: bookingGuestEmail,
          },
          include: {
            court: true,
          },
        })
        createdBookings.push(booking)
      } catch (error: unknown) {
        // Handle unique constraint violation (race condition - slot just booked by someone else)
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          // Clean up any already-created bookings from this batch
          if (createdBookings.length > 0) {
            await prisma.booking.deleteMany({
              where: { id: { in: createdBookings.map(b => b.id) } },
            })
          }
          return NextResponse.json(
            { error: 'This slot was just booked by someone else. Please select another time.' },
            { status: 409 }
          )
        }
        throw error
      }
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create booking', details: errorMessage },
      { status: 500 }
    )
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
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
