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
    const { slots, date, sport, isTestBooking, isGuestBooking, guestName, guestPhone, guestEmail } = body

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

    if (isGuestBooking) {
      // Guest booking - no login required
      if (!guestName || !guestPhone) {
        return NextResponse.json(
          { error: 'Name and phone number are required for guest bookings' },
          { status: 400 }
        )
      }
      bookingGuestName = guestName
      bookingGuestPhone = guestPhone
      bookingGuestEmail = guestEmail || null
      bookingStatus = 'confirmed' // Guest bookings are confirmed (pay at counter)
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
    } else {
      // Regular logged-in user booking
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Please log in or book as a guest' },
          { status: 401 }
        )
      }
      userId = session.user.id
      // For now, auto-confirm (future: require payment)
      bookingStatus = 'confirmed'
    }

    const bookingDate = new Date(date)

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

    // Create bookings for each slot
    const createdBookings = await prisma.$transaction(
      slots.map((slot: { courtId: number; slotTime: string; hourlyRate: number }) =>
        prisma.booking.create({
          data: {
            userId,
            courtId: slot.courtId,
            sport,
            bookingDate,
            startTime: slot.slotTime,
            endTime: getEndTime(slot.slotTime),
            totalAmount: slot.hourlyRate,
            status: bookingStatus,
            guestName: bookingGuestName,
            guestPhone: bookingGuestPhone,
            guestEmail: bookingGuestEmail,
          },
        })
      )
    )

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        bookings: createdBookings,
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

// Helper to calculate end time (1 hour after start)
function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHour = hours + 1
  return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
