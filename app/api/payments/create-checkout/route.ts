import { NextRequest, NextResponse } from 'next/server'
import { stripe, formatAmountForStripe, PAYMENT_METHOD_TYPES } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const {
      bookingIds,
      customerEmail,
      customerName,
      customerPhone,
    } = body

    if (!bookingIds || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'No bookings provided' },
        { status: 400 }
      )
    }

    // Fetch the bookings
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        paymentStatus: 'pending',
      },
      include: {
        court: true,
      },
    })

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'No valid bookings found' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0)

    // Create line items for Stripe
    const lineItems = bookings.map((booking) => ({
      price_data: {
        currency: 'myr',
        product_data: {
          name: `${booking.court.name} - ${booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}`,
          description: `${new Date(booking.bookingDate).toLocaleDateString('en-MY', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} | ${booking.startTime} - ${booking.endTime}`,
        },
        unit_amount: formatAmountForStripe(booking.totalAmount),
      },
      quantity: 1,
    }))

    // Get the base URL
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: PAYMENT_METHOD_TYPES,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customerEmail || session?.user?.email || undefined,
      metadata: {
        bookingIds: JSON.stringify(bookingIds),
        customerName: customerName || session?.user?.name || '',
        customerPhone: customerPhone || '',
        userId: session?.user?.id || '',
      },
      payment_intent_data: {
        metadata: {
          bookingIds: JSON.stringify(bookingIds),
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    })

    // Update bookings with stripe session ID
    await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: {
        stripeSessionId: checkoutSession.id,
      },
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
