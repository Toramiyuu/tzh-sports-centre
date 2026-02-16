import { NextRequest, NextResponse } from 'next/server'
import { stripe, formatAmountForStripe, PAYMENT_METHOD_TYPES } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getCachedTimeSlots } from '@/lib/cache'
import { auth } from '@/lib/auth'
import { getSlotRate } from '@/lib/recurring-booking-utils'

interface SlotData {
  courtId: number
  slotTime: string
  slotRate?: number // ignored server-side, kept for backward compat
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const session = await auth()
    const body = await request.json()

    const {
      slots,
      date,
      sport,
      customerEmail,
      customerName,
      customerPhone,
    } = body

    if (!slots || slots.length === 0) {
      return NextResponse.json(
        { error: 'No slots provided' },
        { status: 400 }
      )
    }

    if (!date || !sport) {
      return NextResponse.json(
        { error: 'Date and sport are required' },
        { status: 400 }
      )
    }

    const bookingDate = new Date(date)
    const dayOfWeek = bookingDate.getDay()

    // Check all conflicts and fetch courts in parallel for performance
    const courtIds = [...new Set(slots.map((s: SlotData) => s.courtId))] as number[]

    const [existingBookings, recurringConflicts, lessonSessions, timeSlots, courts] = await Promise.all([
      prisma.booking.findMany({
        where: {
          bookingDate,
          status: { in: ['pending', 'confirmed'] },
          OR: slots.map((slot: SlotData) => ({
            courtId: slot.courtId,
            startTime: slot.slotTime,
          })),
        },
      }),
      prisma.recurringBooking.findMany({
        where: {
          dayOfWeek,
          isActive: true,
          startDate: { lte: bookingDate },
          OR: [
            { endDate: null },
            { endDate: { gte: bookingDate } },
          ],
        },
      }),
      prisma.lessonSession.findMany({
        where: {
          lessonDate: bookingDate,
          status: 'scheduled',
        },
        select: {
          courtId: true,
          startTime: true,
          endTime: true,
        },
      }),
      getCachedTimeSlots(),
      prisma.court.findMany({
        where: { id: { in: courtIds } },
      }),
    ])

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'One or more slots are no longer available' },
        { status: 409 }
      )
    }

    const recurringSlotSet = new Set(
      recurringConflicts.map(r => `${r.courtId}-${r.startTime}`)
    )

    const hasRecurringConflict = slots.some(
      (slot: SlotData) => recurringSlotSet.has(`${slot.courtId}-${slot.slotTime}`)
    )

    if (hasRecurringConflict) {
      return NextResponse.json(
        { error: 'One or more slots conflict with a recurring booking' },
        { status: 409 }
      )
    }

    const allSlotTimes = timeSlots.map(s => s.slotTime)
    const lessonSlotSet = new Set<string>()

    lessonSessions.forEach((lesson) => {
      const startIdx = allSlotTimes.indexOf(lesson.startTime)
      const endIdx = allSlotTimes.indexOf(lesson.endTime)
      if (startIdx !== -1) {
        const endIndex = endIdx !== -1 ? endIdx : allSlotTimes.length
        for (let i = startIdx; i < endIndex; i++) {
          lessonSlotSet.add(`${lesson.courtId}-${allSlotTimes[i]}`)
        }
      }
    })

    const hasLessonConflict = slots.some(
      (slot: SlotData) => lessonSlotSet.has(`${slot.courtId}-${slot.slotTime}`)
    )

    if (hasLessonConflict) {
      return NextResponse.json(
        { error: 'One or more slots conflict with a scheduled lesson' },
        { status: 409 }
      )
    }
    const courtMap = new Map(courts.map(c => [c.id, c]))

    // Calculate total amount SERVER-SIDE (never trust client-submitted rates)
    const totalAmount = slots.reduce((sum: number, s: SlotData) => sum + getSlotRate(sport, s.slotTime), 0)

    // Helper function to calculate end time
    const getEndTime = (startTime: string): string => {
      const [hours, minutes] = startTime.split(':').map(Number)
      let endMinutes = minutes + 30
      let endHours = hours
      if (endMinutes >= 60) {
        endMinutes = 0
        endHours = hours + 1
      }
      return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    }

    // Create line items for Stripe
    const lineItems = slots.map((slot: SlotData) => {
      const court = courtMap.get(slot.courtId)
      return {
        price_data: {
          currency: 'myr',
          product_data: {
            name: `${court?.name || `Court ${slot.courtId}`} - ${sport.charAt(0).toUpperCase() + sport.slice(1)}`,
            description: `${bookingDate.toLocaleDateString('en-MY', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} | ${slot.slotTime} - ${getEndTime(slot.slotTime)}`,
          },
          unit_amount: formatAmountForStripe(getSlotRate(sport, slot.slotTime)),
        },
        quantity: 1,
      }
    })

    // Get the base URL
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: PAYMENT_METHOD_TYPES,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: (customerEmail?.trim()) || session?.user?.email || undefined,
      metadata: {
        // Store all booking details to create booking after payment
        slots: JSON.stringify(slots),
        date: date,
        sport: sport,
        customerName: (customerName?.trim()) || session?.user?.name || '',
        customerPhone: customerPhone?.trim() || '',
        customerEmail: (customerEmail?.trim()) || session?.user?.email || '',
        userId: session?.user?.id || '',
      },
      payment_intent_data: {
        metadata: {
          slots: JSON.stringify(slots),
          date: date,
          sport: sport,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
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
