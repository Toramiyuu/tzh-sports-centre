import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Disable body parsing, need raw body for webhook verification
export const dynamic = 'force-dynamic'

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

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event: Stripe.Event

    // If we have a webhook secret, verify the signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only process if payment is complete
        if (session.payment_status !== 'paid') {
          break
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
          break
        }

        const bookingDate = new Date(date)

        // Check if bookings already exist for this session (idempotency)
        const existingBookings = await prisma.booking.findMany({
          where: { stripeSessionId: session.id },
        })

        if (existingBookings.length > 0) {
          break
        }

        // Check for slot conflicts
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
          console.error('Slot conflict after payment! Session:', session.id, 'Will need manual refund.')
          break
        }

        // Create bookings
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
                paymentIntentId: session.payment_intent as string,
                stripeSessionId: session.id,
                paidAt: new Date(),
                guestName: userId ? null : customerName,
                guestPhone: userId ? null : customerPhone,
                guestEmail: userId ? null : customerEmail,
              },
            })
          )
        )

        break
      }

      case 'checkout.session.expired': {
        // No bookings to cancel since we don't create them until payment
        break
      }

      case 'payment_intent.payment_failed': {
        // No bookings to update since we don't create them until payment
        break
      }

      default:
        break
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
