import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

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

    // Get booking IDs from metadata
    const bookingIds = JSON.parse(session.metadata?.bookingIds || '[]')

    // If payment was successful, update the bookings (backup in case webhook failed)
    if (session.payment_status === 'paid' && bookingIds.length > 0) {
      await prisma.booking.updateMany({
        where: {
          id: { in: bookingIds },
          paymentStatus: 'pending', // Only update if still pending
        },
        data: {
          paymentStatus: 'paid',
          paymentIntentId: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id,
          paymentMethod: session.payment_method_types?.[0] || 'card',
          paidAt: new Date(),
          status: 'confirmed',
        },
      })
    }

    // Fetch the updated bookings
    const bookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
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

    return NextResponse.json({
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      bookings,
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
