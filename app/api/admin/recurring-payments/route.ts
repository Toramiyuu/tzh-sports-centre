import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { countSessionsInMonth, calculateHours } from '@/lib/recurring-booking-utils'

// GET - Get payments for a recurring booking
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const recurringBookingId = searchParams.get('recurringBookingId')

    if (recurringBookingId) {
      // Get payments for a specific recurring booking
      const payments = await prisma.recurringBookingPayment.findMany({
        where: { recurringBookingId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      })

      const recurringBooking = await prisma.recurringBooking.findUnique({
        where: { id: recurringBookingId },
        include: { court: true },
      })

      return NextResponse.json({ payments, recurringBooking })
    }

    // Get all recurring bookings with their payment status for current month
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const recurringBookings = await prisma.recurringBooking.findMany({
      where: { isActive: true },
      include: {
        court: true,
        user: { select: { name: true, phone: true, uid: true } },
        payments: {
          where: { year: currentYear, month: currentMonth },
        },
      },
    })

    return NextResponse.json({ recurringBookings, currentMonth, currentYear })
  } catch (error) {
    console.error('Error fetching recurring payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST - Generate monthly invoice for a recurring booking
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { recurringBookingId, month, year } = body

    if (!recurringBookingId || !month || !year) {
      return NextResponse.json(
        { error: 'recurringBookingId, month, and year are required' },
        { status: 400 }
      )
    }

    // Get the recurring booking
    const recurringBooking = await prisma.recurringBooking.findUnique({
      where: { id: recurringBookingId },
      include: { court: true },
    })

    if (!recurringBooking) {
      return NextResponse.json({ error: 'Recurring booking not found' }, { status: 404 })
    }

    // Check if payment already exists
    const existingPayment = await prisma.recurringBookingPayment.findUnique({
      where: {
        recurringBookingId_month_year: {
          recurringBookingId,
          month,
          year,
        },
      },
    })

    if (existingPayment) {
      return NextResponse.json({ error: 'Payment record already exists for this month' }, { status: 409 })
    }

    // Calculate the amount
    const sessionsCount = countSessionsInMonth(year, month, recurringBooking.dayOfWeek)
    const hours = calculateHours(recurringBooking.startTime, recurringBooking.endTime)
    const hourlyRate = recurringBooking.hourlyRate || recurringBooking.court.hourlyRate
    const amount = sessionsCount * hours * hourlyRate

    // Create the payment record
    const payment = await prisma.recurringBookingPayment.create({
      data: {
        recurringBookingId,
        month,
        year,
        amount,
        sessionsCount,
        status: 'pending',
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment record:', error)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }
}

// PATCH - Mark payment as paid
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { paymentId, status, paymentMethod, notes } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    const updateData: {
      status?: string
      paymentMethod?: string
      notes?: string
      paidAt?: Date | null
    } = {}

    if (status) {
      updateData.status = status
      if (status === 'paid') {
        updateData.paidAt = new Date()
      } else {
        updateData.paidAt = null
      }
    }

    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const payment = await prisma.recurringBookingPayment.update({
      where: { id: paymentId },
      data: updateData,
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

// DELETE - Delete a payment record
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { paymentId } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    await prisma.recurringBookingPayment.delete({
      where: { id: paymentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
