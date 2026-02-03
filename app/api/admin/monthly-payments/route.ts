import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { fromZonedTime } from 'date-fns-tz'
import {
  calculateHours,
  calculateBookingAmount,
  getSportRate,
  countSessionsInMonth,
} from '@/lib/recurring-booking-utils'

const TIMEZONE = 'Asia/Kuala_Lumpur'

// GET: List users with monthly payment summaries
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const userId = searchParams.get('userId')

    // If userId specified, return detailed breakdown for that user
    if (userId) {
      return getDetailedBreakdown(userId, month, year)
    }

    // Calculate date range for the month in Malaysia timezone (UTC+8)
    const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE)
    const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE)

    // Get all users who have bookings or recurring bookings
    const usersWithBookings = await prisma.user.findMany({
      where: {
        OR: [
          {
            bookings: {
              some: {
                bookingDate: { gte: startDate, lt: endDate },
                status: { not: 'cancelled' },
              },
            },
          },
          {
            recurringBookings: {
              some: {
                isActive: true,
                startDate: { lte: endDate },
                OR: [
                  { endDate: null },
                  { endDate: { gte: startDate } },
                ],
              },
            },
          },
        ],
      },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: startDate, lt: endDate },
            status: { not: 'cancelled' },
          },
        },
        recurringBookings: {
          where: {
            isActive: true,
            startDate: { lte: endDate },
            OR: [
              { endDate: null },
              { endDate: { gte: startDate } },
            ],
          },
          include: { court: true },
        },
        monthlyPayments: {
          where: { month, year },
          include: { transactions: true },
        },
      },
    })

    // Calculate totals for each user
    const summaries = usersWithBookings.map((user) => {
      // Sum from regular bookings
      let totalFromBookings = 0
      let hoursFromBookings = 0
      let bookingCount = user.bookings.length

      for (const booking of user.bookings) {
        totalFromBookings += booking.totalAmount
        hoursFromBookings += calculateHours(booking.startTime, booking.endTime)
      }

      // Sum from recurring bookings (calculate sessions in month)
      let totalFromRecurring = 0
      let hoursFromRecurring = 0
      let recurringSessionCount = 0

      for (const rb of user.recurringBookings) {
        const sessions = countSessionsInMonth(year, month, rb.dayOfWeek)
        const hours = calculateHours(rb.startTime, rb.endTime)
        // Use peak hour pricing: calculate amount per session with split pricing
        const amountPerSession = rb.hourlyRate
          ? hours * rb.hourlyRate
          : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport)
        const amount = sessions * amountPerSession

        totalFromRecurring += amount
        hoursFromRecurring += sessions * hours
        recurringSessionCount += sessions
      }

      const totalAmount = totalFromBookings + totalFromRecurring
      const totalHours = hoursFromBookings + hoursFromRecurring
      const totalBookings = bookingCount + recurringSessionCount

      // Get payment info
      const monthlyPayment = user.monthlyPayments[0]
      const paidAmount = monthlyPayment?.paidAmount || 0
      const unpaidAmount = totalAmount - paidAmount

      return {
        userId: user.id,
        uid: user.uid.toString().padStart(3, '0'),
        name: user.name,
        email: user.email,
        phone: user.phone,
        totalAmount,
        paidAmount,
        unpaidAmount,
        totalHours,
        bookingsCount: totalBookings,
        regularBookings: bookingCount,
        recurringBookings: recurringSessionCount,
        status: monthlyPayment?.status || (totalAmount > 0 ? 'unpaid' : 'no-bookings'),
        paymentId: monthlyPayment?.id || null,
        transactions: monthlyPayment?.transactions || [],
      }
    })

    // Filter out users with no bookings
    const filtered = summaries.filter((s) => s.totalAmount > 0)

    // Sort: unpaid first, then partial, then paid
    const statusOrder: Record<string, number> = { unpaid: 0, partial: 1, paid: 2 }
    filtered.sort((a, b) => {
      const aOrder = statusOrder[a.status] ?? 3
      const bOrder = statusOrder[b.status] ?? 3
      if (aOrder !== bOrder) return aOrder - bOrder
      return b.unpaidAmount - a.unpaidAmount
    })

    // Calculate overall totals
    const totals = {
      totalDue: filtered.reduce((sum, s) => sum + s.totalAmount, 0),
      totalPaid: filtered.reduce((sum, s) => sum + s.paidAmount, 0),
      totalUnpaid: filtered.reduce((sum, s) => sum + s.unpaidAmount, 0),
      usersCount: filtered.length,
      paidCount: filtered.filter((s) => s.status === 'paid').length,
      partialCount: filtered.filter((s) => s.status === 'partial').length,
      unpaidCount: filtered.filter((s) => s.status === 'unpaid').length,
    }

    return NextResponse.json({ users: filtered, totals, month, year })
  } catch (error) {
    console.error('Error fetching monthly payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly payments' },
      { status: 500 }
    )
  }
}

// Get detailed breakdown for a specific user
async function getDetailedBreakdown(userId: string, month: number, year: number) {
  const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE)
  const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        where: {
          bookingDate: { gte: startDate, lt: endDate },
          status: { not: 'cancelled' },
        },
        include: { court: true },
        orderBy: { bookingDate: 'asc' },
      },
      recurringBookings: {
        where: {
          isActive: true,
          startDate: { lte: endDate },
          OR: [
            { endDate: null },
            { endDate: { gte: startDate } },
          ],
        },
        include: { court: true },
      },
      monthlyPayments: {
        where: { month, year },
        include: { transactions: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Build detailed breakdown
  const breakdown: Array<{
    type: 'booking' | 'recurring'
    date: string
    court: string
    sport: string
    time: string
    hours: number
    rate: number
    amount: number
    bookingId?: string
    recurringId?: string
  }> = []

  // Add regular bookings
  for (const booking of user.bookings) {
    const hours = calculateHours(booking.startTime, booking.endTime)
    breakdown.push({
      type: 'booking',
      date: booking.bookingDate.toISOString().split('T')[0],
      court: booking.court.name,
      sport: booking.sport,
      time: `${booking.startTime} - ${booking.endTime}`,
      hours,
      rate: booking.totalAmount / hours,
      amount: booking.totalAmount,
      bookingId: booking.id,
    })
  }

  // Add recurring booking sessions
  const daysInMonth = new Date(year, month, 0).getDate()
  for (const rb of user.recurringBookings) {
    const hours = calculateHours(rb.startTime, rb.endTime)
    // Use peak hour pricing: calculate amount with split pricing for bookings crossing 6 PM
    const amount = rb.hourlyRate
      ? hours * rb.hourlyRate
      : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport)
    const effectiveRate = amount / hours // For display purposes

    // Generate each session date
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      if (date.getDay() === rb.dayOfWeek) {
        breakdown.push({
          type: 'recurring',
          date: date.toISOString().split('T')[0],
          court: rb.court.name,
          sport: rb.sport,
          time: `${rb.startTime} - ${rb.endTime}`,
          hours,
          rate: effectiveRate,
          amount,
          recurringId: rb.id,
        })
      }
    }
  }

  // Sort by date
  breakdown.sort((a, b) => a.date.localeCompare(b.date))

  const totalAmount = breakdown.reduce((sum, b) => sum + b.amount, 0)
  const totalHours = breakdown.reduce((sum, b) => sum + b.hours, 0)
  const monthlyPayment = user.monthlyPayments[0]

  return NextResponse.json({
    user: {
      id: user.id,
      uid: user.uid.toString().padStart(3, '0'),
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    breakdown,
    summary: {
      totalAmount,
      paidAmount: monthlyPayment?.paidAmount || 0,
      unpaidAmount: totalAmount - (monthlyPayment?.paidAmount || 0),
      totalHours,
      bookingsCount: breakdown.length,
      status: monthlyPayment?.status || 'unpaid',
    },
    transactions: monthlyPayment?.transactions || [],
    month,
    year,
  })
}

// POST: Record a payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, month, year, amount, paymentMethod, reference, notes, idempotencyKey } = body

    if (!userId || !month || !year || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, month, year, amount, paymentMethod' },
        { status: 400 }
      )
    }

    // Idempotency check: if this request was already processed, return the existing result
    if (idempotencyKey) {
      const existingTransaction = await prisma.paymentTransaction.findUnique({
        where: { idempotencyKey },
        include: { monthlyPayment: true },
      })
      if (existingTransaction) {
        return NextResponse.json({
          success: true,
          payment: existingTransaction.monthlyPayment,
          transaction: existingTransaction,
          duplicate: true,
        })
      }
    }

    // Get or create monthly payment record
    let monthlyPayment = await prisma.monthlyPayment.findUnique({
      where: { userId_month_year: { userId, month, year } },
    })

    // Calculate total due for this user/month (we need to compute it)
    const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE)
    const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: startDate, lt: endDate },
            status: { not: 'cancelled' },
          },
        },
        recurringBookings: {
          where: {
            isActive: true,
            startDate: { lte: endDate },
            OR: [
              { endDate: null },
              { endDate: { gte: startDate } },
            ],
          },
          include: { court: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate totals
    let totalAmount = 0
    let totalHours = 0
    let bookingsCount = user.bookings.length

    for (const booking of user.bookings) {
      totalAmount += booking.totalAmount
      totalHours += calculateHours(booking.startTime, booking.endTime)
    }

    for (const rb of user.recurringBookings) {
      const sessions = countSessionsInMonth(year, month, rb.dayOfWeek)
      const hours = calculateHours(rb.startTime, rb.endTime)
      // Use peak hour pricing with split calculation
      const amountPerSession = rb.hourlyRate
        ? hours * rb.hourlyRate
        : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport)
      totalAmount += sessions * amountPerSession
      totalHours += sessions * hours
      bookingsCount += sessions
    }

    // Create or update monthly payment
    const newPaidAmount = (monthlyPayment?.paidAmount || 0) + amount
    const newStatus = newPaidAmount >= totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid'

    // Upsert monthly payment then create transaction record
    const payment = await prisma.monthlyPayment.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: {
        userId,
        month,
        year,
        totalAmount,
        paidAmount: amount,
        bookingsCount,
        totalHours,
        status: newStatus,
        markedPaidBy: newStatus === 'paid' ? session.user!.email : null,
        markedPaidAt: newStatus === 'paid' ? new Date() : null,
      },
      update: {
        totalAmount,
        paidAmount: newPaidAmount,
        bookingsCount,
        totalHours,
        status: newStatus,
        markedPaidBy: newStatus === 'paid' ? session.user!.email : undefined,
        markedPaidAt: newStatus === 'paid' ? new Date() : undefined,
      },
    })

    // Create transaction record
    const transaction = await prisma.paymentTransaction.create({
      data: {
        monthlyPaymentId: payment.id,
        amount,
        paymentMethod,
        reference,
        notes,
        recordedBy: session.user!.email!,
        idempotencyKey: idempotencyKey || undefined,
      },
    })

    const result = { payment, transaction }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      transaction: result.transaction,
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

// PATCH: Bulk mark paid
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userIds, month, year, paymentMethod, reference, notes } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
    }

    if (!month || !year || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: month, year, paymentMethod' },
        { status: 400 }
      )
    }

    const results = []
    const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE)
    const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE)

    for (const userId of userIds) {
      try {
        // Get user with bookings
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            bookings: {
              where: {
                bookingDate: { gte: startDate, lt: endDate },
                status: { not: 'cancelled' },
              },
            },
            recurringBookings: {
              where: {
                isActive: true,
                startDate: { lte: endDate },
                OR: [
                  { endDate: null },
                  { endDate: { gte: startDate } },
                ],
              },
              include: { court: true },
            },
            monthlyPayments: {
              where: { month, year },
            },
          },
        })

        if (!user) continue

        // Calculate totals
        let totalAmount = 0
        let totalHours = 0
        let bookingsCount = user.bookings.length

        for (const booking of user.bookings) {
          totalAmount += booking.totalAmount
          totalHours += calculateHours(booking.startTime, booking.endTime)
        }

        for (const rb of user.recurringBookings) {
          const sessions = countSessionsInMonth(year, month, rb.dayOfWeek)
          const hours = calculateHours(rb.startTime, rb.endTime)
          const amountPerSession = rb.hourlyRate
            ? hours * rb.hourlyRate
            : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport)
          totalAmount += sessions * amountPerSession
          totalHours += sessions * hours
          bookingsCount += sessions
        }

        if (totalAmount === 0) continue

        const existingPayment = user.monthlyPayments[0]
        const amountToPay = totalAmount - (existingPayment?.paidAmount || 0)

        if (amountToPay <= 0) continue // Already paid

        // Mark as paid
        const payment = await prisma.monthlyPayment.upsert({
          where: { userId_month_year: { userId, month, year } },
          create: {
            userId,
            month,
            year,
            totalAmount,
            paidAmount: totalAmount,
            bookingsCount,
            totalHours,
            status: 'paid',
            markedPaidBy: session.user!.email,
            markedPaidAt: new Date(),
          },
          update: {
            totalAmount,
            paidAmount: totalAmount,
            bookingsCount,
            totalHours,
            status: 'paid',
            markedPaidBy: session.user!.email,
            markedPaidAt: new Date(),
          },
        })

        await prisma.paymentTransaction.create({
          data: {
            monthlyPaymentId: payment.id,
            amount: amountToPay,
            paymentMethod,
            reference,
            notes: notes || `Bulk payment for ${month}/${year}`,
            recordedBy: session.user!.email!,
          },
        })

        results.push({ userId, name: user.name, amount: amountToPay, success: true })
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err)
        results.push({ userId, success: false, error: 'Processing failed' })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Error bulk marking paid:', error)
    return NextResponse.json(
      { error: 'Failed to bulk mark paid' },
      { status: 500 }
    )
  }
}
