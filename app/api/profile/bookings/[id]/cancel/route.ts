import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { differenceInHours } from 'date-fns'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership
    if (booking.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // Check if within 24 hours
    const bookingDateTime = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`)
    const hoursUntilBooking = differenceInHours(bookingDateTime, new Date())

    if (hoursUntilBooking < 24) {
      return NextResponse.json(
        { error: 'Cannot cancel bookings within 24 hours of start time' },
        { status: 400 }
      )
    }

    // Cancel booking and add credit
    const creditAmount = booking.totalAmount

    await prisma.$transaction([
      // Update booking status
      prisma.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          creditRefunded: creditAmount,
        },
      }),
      // Add credit to user
      prisma.user.update({
        where: { id: user.id },
        data: {
          creditBalance: { increment: creditAmount },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      creditAdded: creditAmount,
      message: `Booking cancelled. RM${creditAmount.toFixed(2)} added to your credit balance.`,
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
