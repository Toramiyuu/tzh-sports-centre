import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// PATCH - Confirm payment for a booking (mark as paid)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!session.user.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json(
        { error: 'Only admins can confirm payments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bookingIds } = body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'No booking IDs provided' },
        { status: 400 }
      )
    }

    // Update all provided bookings to paid status
    const updatedBookings = await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        paymentStatus: 'pending', // Only update pending payments
      },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    })

    return NextResponse.json({
      message: 'Payment confirmed successfully',
      updatedCount: updatedBookings.count,
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
