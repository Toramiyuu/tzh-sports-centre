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

    // Get all time slots
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { id: 'asc' },
    })

    // Get existing bookings for the date
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: new Date(date),
        status: { in: ['pending', 'confirmed'] },
        ...(courtId ? { courtId: parseInt(courtId) } : {}),
      },
      select: {
        courtId: true,
        startTime: true,
      },
    })

    // Create a set of booked slots per court
    const bookedSlots: Record<number, Set<string>> = {}
    bookings.forEach((booking) => {
      if (!bookedSlots[booking.courtId]) {
        bookedSlots[booking.courtId] = new Set()
      }
      bookedSlots[booking.courtId].add(booking.startTime)
    })

    // Get courts
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    })

    // Build availability matrix
    const availability = courts.map((court) => ({
      court,
      slots: timeSlots.map((slot) => ({
        ...slot,
        available: !bookedSlots[court.id]?.has(slot.slotTime),
      })),
    }))

    return NextResponse.json({
      date,
      timeSlots,
      courts,
      availability,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
