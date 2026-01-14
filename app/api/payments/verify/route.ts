import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

interface SlotData {
  courtId: number
  slotTime: string
  slotRate: number
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

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        status: session.payment_status,
        message: 'Payment not completed',
        bookings: [],
      })
    }

    // Get booking details from metadata
    const slots: SlotData[] = JSON.parse(session.metadata?.slots || '[]')
    const date = session.metadata?.date
    const sport = session.metadata?.sport
    const customerName = session.metadata?.customerName || ''
    const customerPhone = session.metadata?.customerPhone || ''
    const customerEmail = session.metadata?.customerEmail || ''
    const userId = session.metadata?.userId || null

    if (slots.length === 0 || !date || !sport) {
      return NextResponse.json(
        { error: 'Invalid session metadata' },
        { status: 400 }
      )
    }

    const bookingDate = new Date(date)

    // Check if bookings already exist for this session (idempotency)
    const existingBookings = await prisma.booking.findMany({
      where: {
        stripeSessionId: sessionId,
      },
      include: {
        court: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (existingBookings.length > 0) {
      // Bookings already created (by webhook or previous verify call)
      return NextResponse.json({
        status: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        bookings: existingBookings,
        metadata: session.metadata,
      })
    }

    // Double-check for slot conflicts before creating bookings
    const conflictCheck = await prisma.booking.findMany({
      where: {
        bookingDate,
        status: { in: ['pending', 'confirmed'] },
        OR: slots.map((slot) => ({
          courtId: slot.courtId,
          startTime: slot.slotTime,
        })),
      },
    })

    if (conflictCheck.length > 0) {
      // This should rarely happen, but handle it gracefully
      // The payment went through but slots were taken - will need manual refund
      console.error('Slot conflict after payment! Session:', sessionId, 'Conflicts:', conflictCheck)
      return NextResponse.json({
        status: 'conflict',
        message: 'Some slots were booked by another user. Please contact support for a refund.',
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        bookings: [],
      })
    }

    // Create bookings for each slot
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

    const createdBookings = await prisma.$transaction(
      slots.map((slot) =>
        prisma.booking.create({
          data: {
            userId: userId || null,
            courtId: slot.courtId,
            sport,
            bookingDate,
            startTime: slot.slotTime,
            endTime: getEndTime(slot.slotTime),
            totalAmount: slot.slotRate,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentMethod: session.payment_method_types?.[0] || 'card',
            paymentIntentId,
            stripeSessionId: sessionId,
            paidAt: new Date(),
            guestName: userId ? null : customerName,
            guestPhone: userId ? null : customerPhone,
            guestEmail: userId ? null : customerEmail,
          },
          include: {
            court: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        })
      )
    )

    return NextResponse.json({
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      bookings: createdBookings,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
