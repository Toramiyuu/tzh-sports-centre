import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch bookings by phone number
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number (remove any formatting)
    const normalizedPhone = phone.replace(/\D/g, '')

    // Search for bookings by guest phone or user phone
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          // Guest bookings - try different phone formats
          { guestPhone: phone },
          { guestPhone: normalizedPhone },
          { guestPhone: { contains: normalizedPhone } },
          // User bookings
          {
            user: {
              phone: { contains: normalizedPhone },
            },
          },
        ],
      },
      include: {
        court: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'asc' },
      ],
    })

    // Format the response
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      court: booking.court.name,
      sport: booking.sport,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: booking.totalAmount,
      status: booking.status,
      name: booking.guestName || booking.user?.name || 'Unknown',
      phone: booking.guestPhone || booking.user?.phone || '',
      createdAt: booking.createdAt,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
