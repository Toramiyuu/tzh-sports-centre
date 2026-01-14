import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const queryDate = new Date(date)
    const dayOfWeek = queryDate.getDay()

    // Get all bookings for the date with user/guest info
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: queryDate,
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        court: true,
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [
        { courtId: 'asc' },
        { startTime: 'asc' },
      ],
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
      },
      include: {
        court: true,
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [
        { courtId: 'asc' },
        { startTime: 'asc' },
      ],
    })

    // Get all time slots
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { id: 'asc' },
    })

    // Get all courts
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    })

    // Format bookings for the grid
    const bookingMap: Record<string, {
      id: string
      name: string
      phone: string
      email: string | null
      sport: string
      status: string
      paymentStatus?: string
      isGuest: boolean
      isRecurring?: boolean
      recurringLabel?: string
    }> = {}

    // Add regular bookings
    bookings.forEach((booking) => {
      const key = `${booking.courtId}-${booking.startTime}`
      bookingMap[key] = {
        id: booking.id,
        name: booking.guestName || booking.user?.name || 'Unknown',
        phone: booking.guestPhone || booking.user?.phone || '',
        email: booking.guestEmail || booking.user?.email || null,
        sport: booking.sport,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        isGuest: !booking.userId,
      }
    })

    // Add recurring bookings (only if slot not already taken by regular booking)
    recurringBookings.forEach((recurring) => {
      const key = `${recurring.courtId}-${recurring.startTime}`
      if (!bookingMap[key]) {
        bookingMap[key] = {
          id: recurring.id,
          name: recurring.label || recurring.guestName || recurring.user?.name || 'Recurring',
          phone: recurring.guestPhone || recurring.user?.phone || '',
          email: recurring.user?.email || null,
          sport: recurring.sport,
          status: 'recurring',
          isGuest: !recurring.userId,
          isRecurring: true,
          recurringLabel: recurring.label || undefined,
        }
      }
    })

    return NextResponse.json({
      date,
      bookings,
      recurringBookings,
      bookingMap,
      timeSlots,
      courts,
    })
  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// Cancel booking(s) - supports single or multiple for pickleball
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Support both single bookingId and array of bookingIds
    const bookingIds: string[] = body.bookingIds || (body.bookingId ? [body.bookingId] : [])

    if (bookingIds.length === 0) {
      return NextResponse.json({ error: 'Booking ID(s) required' }, { status: 400 })
    }

    // Cancel all specified bookings
    await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ success: true, cancelled: bookingIds.length })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}

// Add a booking manually
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courtId, date, startTime, endTime, sport, guestName, guestPhone } = await request.json()

    if (!courtId || !date || !startTime || !endTime || !sport || !guestName || !guestPhone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const bookingDate = new Date(date)
    const dayOfWeek = bookingDate.getDay()

    // Check if slot is already booked
    const existing = await prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate,
        startTime,
        status: { in: ['pending', 'confirmed'] },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'This slot is already booked' }, { status: 400 })
    }

    // Check for recurring booking conflicts
    const recurringConflict = await prisma.recurringBooking.findFirst({
      where: {
        courtId,
        dayOfWeek,
        startTime,
        isActive: true,
        startDate: { lte: bookingDate },
        OR: [
          { endDate: null },
          { endDate: { gte: bookingDate } },
        ],
      },
    })

    if (recurringConflict) {
      return NextResponse.json({ error: 'This slot conflicts with a recurring booking' }, { status: 400 })
    }

    // Check for lesson session conflicts
    const lessonConflict = await prisma.lessonSession.findFirst({
      where: {
        courtId,
        lessonDate: bookingDate,
        status: 'scheduled',
        startTime: { lte: startTime },
        endTime: { gt: startTime },
      },
    })

    if (lessonConflict) {
      return NextResponse.json({ error: 'This slot conflicts with a scheduled lesson' }, { status: 400 })
    }

    // Get court for pricing
    const court = await prisma.court.findUnique({ where: { id: courtId } })
    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const hourlyRate = sport === 'pickleball' ? 25 : 15

    const booking = await prisma.booking.create({
      data: {
        courtId,
        bookingDate: new Date(date),
        startTime,
        endTime,
        sport,
        totalAmount: hourlyRate,
        status: 'confirmed',
        paymentStatus: 'paid', // Admin-created bookings are confirmed/paid
        guestName,
        guestPhone,
      },
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
