import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Disable body parsing, need raw body for webhook verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event: Stripe.Event

    // If we have a webhook secret, verify the signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        )
      }
    } else {
      // For development without webhook secret
      event = JSON.parse(body) as Stripe.Event
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get booking IDs from metadata
        const bookingIds = JSON.parse(session.metadata?.bookingIds || '[]')

        if (bookingIds.length > 0) {
          // Update bookings to paid
          await prisma.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: {
              paymentStatus: 'paid',
              paymentIntentId: session.payment_intent as string,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              paidAt: new Date(),
              status: 'confirmed',
            },
          })

          console.log(`Payment completed for bookings: ${bookingIds.join(', ')}`)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingIds = JSON.parse(session.metadata?.bookingIds || '[]')

        if (bookingIds.length > 0) {
          // Mark bookings as failed/expired
          await prisma.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: {
              paymentStatus: 'failed',
              status: 'cancelled',
            },
          })

          console.log(`Payment expired for bookings: ${bookingIds.join(', ')}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingIds = JSON.parse(paymentIntent.metadata?.bookingIds || '[]')

        if (bookingIds.length > 0) {
          await prisma.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: {
              paymentStatus: 'failed',
            },
          })

          console.log(`Payment failed for bookings: ${bookingIds.join(', ')}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
