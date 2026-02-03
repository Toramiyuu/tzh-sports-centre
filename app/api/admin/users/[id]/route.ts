import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import bcrypt from 'bcryptjs'
import {
  calculateHours,
  calculateBookingAmount,
  countSessionsInMonth,
  groupRecurringSlots,
  ensurePaymentRecords,
  getPaymentStatus,
} from '@/lib/recurring-booking-utils'

const DEFAULT_PASSWORD = 'temp1234'

// GET: Get detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { not: 'cancelled' } },
          include: { court: true },
          orderBy: { bookingDate: 'desc' },
        },
        recurringBookings: {
          include: {
            court: true,
            payments: true,
          },
        },
        monthlyPayments: {
          include: { transactions: true },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if password is the default
    const isDefaultPassword = user.passwordHash
      ? await bcrypt.compare(DEFAULT_PASSWORD, user.passwordHash)
      : false

    // Auto-generate missing payment records for current month
    const activeSlotIds = user.recurringBookings
      .filter(rb => rb.isActive)
      .map(rb => rb.id)

    if (activeSlotIds.length > 0) {
      await ensurePaymentRecords(prisma as any, activeSlotIds, currentMonth, currentYear)

      // Re-fetch payments after generating
      const freshPayments = await prisma.recurringBookingPayment.findMany({
        where: { recurringBookingId: { in: user.recurringBookings.map(rb => rb.id) } },
      })

      // Update in-memory data with fresh payments
      for (const rb of user.recurringBookings) {
        rb.payments = freshPayments.filter(p => p.recurringBookingId === rb.id)
      }
    }

    // Fetch lesson sessions for this user
    const lessonSessions = await prisma.lessonSession.findMany({
      where: {
        students: { some: { id } },
      },
      include: { court: true, students: true },
      orderBy: { lessonDate: 'desc' },
    })

    // Group recurring booking slots into logical bookings
    const groupedRecurring = groupRecurringSlots(user.recurringBookings as any)

    // Calculate booking summaries
    const bookingsThisWeek = user.bookings.filter(b => {
      const date = new Date(b.bookingDate)
      return date >= weekStart && date <= weekEnd
    }).length

    const bookingsThisMonth = user.bookings.filter(b => {
      const date = new Date(b.bookingDate)
      return date >= monthStart && date <= monthEnd
    }).length

    const bookingsThisYear = user.bookings.filter(b => {
      const date = new Date(b.bookingDate)
      return date >= yearStart && date <= yearEnd
    }).length

    // Calculate lesson summaries
    const lessonsScheduled = lessonSessions.filter(l => l.status === 'scheduled').length
    const lessonsCompleted = lessonSessions.filter(l => l.status === 'completed').length
    const lessonsCancelled = lessonSessions.filter(l => l.status === 'cancelled').length

    const lessonsThisWeek = lessonSessions.filter(l => {
      const date = new Date(l.lessonDate)
      return date >= weekStart && date <= weekEnd && l.status !== 'cancelled'
    }).length

    const lessonsThisMonth = lessonSessions.filter(l => {
      const date = new Date(l.lessonDate)
      return date >= monthStart && date <= monthEnd && l.status !== 'cancelled'
    }).length

    const lessonsThisYear = lessonSessions.filter(l => {
      const date = new Date(l.lessonDate)
      return date >= yearStart && date <= yearEnd && l.status !== 'cancelled'
    }).length

    // Calculate payment summary for current month
    let totalDueThisMonth = 0
    let totalHoursThisMonth = 0

    // Add regular bookings for this month
    user.bookings
      .filter(b => {
        const date = new Date(b.bookingDate)
        return date >= monthStart && date <= monthEnd
      })
      .forEach(b => {
        totalDueThisMonth += b.totalAmount
        totalHoursThisMonth += calculateHours(b.startTime, b.endTime)
      })

    // Add recurring booking amounts for this month (using grouped bookings)
    let recurringDueThisMonth = 0
    let recurringPaidThisMonth = 0

    for (const group of groupedRecurring) {
      if (!group.isActive) continue

      const sessionsCount = countSessionsInMonth(currentYear, currentMonth, group.dayOfWeek)
      const monthlyAmount = sessionsCount * group.amountPerSession
      recurringDueThisMonth += monthlyAmount
      totalDueThisMonth += monthlyAmount
      totalHoursThisMonth += sessionsCount * group.duration

      // Sum paid amounts from slot payment records for current month
      for (const slot of group.slots) {
        const payment = slot.payments?.find(
          (p: any) => p.month === currentMonth && p.year === currentYear && p.status === 'paid'
        )
        if (payment) {
          recurringPaidThisMonth += payment.amount
        }
      }
    }

    const currentMonthPayment = user.monthlyPayments.find(
      mp => mp.month === currentMonth && mp.year === currentYear
    )
    const paidThisMonth = (currentMonthPayment?.paidAmount || 0) + recurringPaidThisMonth
    const unpaidThisMonth = totalDueThisMonth - paidThisMonth

    // Calculate all-time totals — only actually paid amounts
    const totalPaidAllTime = user.monthlyPayments.reduce((sum, mp) => sum + mp.paidAmount, 0)

    // Sum all-time recurring payments that are marked as paid
    const allRecurringPayments = user.recurringBookings.flatMap(rb => rb.payments || [])
    const totalRecurringPaidAllTime = allRecurringPayments
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Calculate recurring outstanding (all unpaid/overdue recurring payments)
    const recurringOutstanding = allRecurringPayments
      .filter((p: any) => p.status !== 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    // Format bookings for timeline
    const bookingsTimeline = user.bookings.slice(0, 50).map(b => ({
      id: b.id,
      type: 'one-time' as const,
      date: b.bookingDate.toISOString().split('T')[0],
      time: `${b.startTime} - ${b.endTime}`,
      duration: calculateHours(b.startTime, b.endTime),
      sport: b.sport,
      court: b.court.name,
      amount: b.totalAmount,
      status: b.status,
    }))

    // Format grouped recurring bookings with payment status
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const recurringBookings = groupedRecurring.map(group => {
      // Gather payment data for current month from all slots in the group
      const currentMonthPayments = group.slots
        .map(slot => slot.payments?.find((p: any) => p.month === currentMonth && p.year === currentYear))
        .filter(Boolean) as any[]

      const sessionsCount = countSessionsInMonth(currentYear, currentMonth, group.dayOfWeek)
      const monthlyAmount = sessionsCount * group.amountPerSession

      // Determine overall payment status for this group's current month
      const allPaid = currentMonthPayments.length > 0 && currentMonthPayments.every((p: any) => p.status === 'paid')
      const somePaid = currentMonthPayments.some((p: any) => p.status === 'paid')

      let currentMonthStatus: 'paid' | 'unpaid' | 'overdue' | 'partial'
      if (allPaid) {
        currentMonthStatus = 'paid'
      } else if (somePaid) {
        currentMonthStatus = 'partial'
      } else if (currentMonthPayments.length > 0) {
        currentMonthStatus = getPaymentStatus(currentMonthPayments[0].status, currentMonth, currentYear)
      } else {
        currentMonthStatus = 'unpaid'
      }

      // Gather payment history (all months)
      const allPayments = group.slots.flatMap(slot =>
        (slot.payments || []).map((p: any) => ({
          id: p.id,
          slotId: slot.id,
          month: p.month,
          year: p.year,
          amount: p.amount,
          sessionsCount: p.sessionsCount,
          status: getPaymentStatus(p.status, p.month, p.year),
          paidAt: p.paidAt?.toISOString() || null,
          paymentMethod: p.paymentMethod,
          notes: p.notes,
        }))
      )

      // Group payments by month/year for summary
      const paymentsByMonth = new Map<string, any[]>()
      for (const p of allPayments) {
        const key = `${p.year}-${p.month}`
        if (!paymentsByMonth.has(key)) paymentsByMonth.set(key, [])
        paymentsByMonth.get(key)!.push(p)
      }

      const paymentHistory = Array.from(paymentsByMonth.entries())
        .map(([, payments]) => ({
          month: payments[0].month,
          year: payments[0].year,
          totalAmount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
          status: payments.every((p: any) => p.status === 'paid') ? 'paid' as const
            : payments.some((p: any) => p.status === 'paid') ? 'partial' as const
            : payments.some((p: any) => p.status === 'overdue') ? 'overdue' as const
            : 'unpaid' as const,
          paidAt: payments.find((p: any) => p.paidAt)?.paidAt || null,
          paymentIds: payments.map((p: any) => p.id),
        }))
        .sort((a, b) => b.year - a.year || b.month - a.month)

      return {
        id: group.slotIds[0], // Use first slot ID as group identifier
        slotIds: group.slotIds,
        schedule: `Every ${days[group.dayOfWeek]}`,
        time: `${group.startTime} - ${group.endTime}`,
        duration: group.duration,
        sport: group.sport,
        court: group.courtName,
        label: group.label,
        isActive: group.isActive,
        startDate: group.startDate.toISOString().split('T')[0],
        endDate: group.endDate?.toISOString().split('T')[0] || null,
        amountPerSession: group.amountPerSession,
        payments: {
          currentMonth: {
            status: currentMonthStatus,
            amount: monthlyAmount,
            sessionsCount,
            paidAt: currentMonthPayments.find((p: any) => p.paidAt)?.paidAt?.toISOString() || null,
            paymentMethod: currentMonthPayments.find((p: any) => p.paymentMethod)?.paymentMethod || null,
            paymentIds: currentMonthPayments.map((p: any) => p.id),
          },
          history: paymentHistory,
        },
      }
    })

    // Format lessons for timeline
    const lessonsTimeline = lessonSessions.slice(0, 50).map(l => ({
      id: l.id,
      date: l.lessonDate.toISOString().split('T')[0],
      time: `${l.startTime} - ${l.endTime}`,
      duration: l.duration,
      type: l.lessonType,
      court: l.court.name,
      price: l.price,
      pricePerStudent: l.price / l.students.length,
      status: l.status,
      students: l.students.map(s => s.name),
    }))

    // Format payment history
    const paymentHistory = user.monthlyPayments.map(mp => ({
      id: mp.id,
      month: mp.month,
      year: mp.year,
      totalAmount: mp.totalAmount,
      paidAmount: mp.paidAmount,
      unpaidAmount: mp.totalAmount - mp.paidAmount,
      status: mp.status,
      transactions: mp.transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        method: t.paymentMethod,
        reference: t.reference,
        date: t.recordedAt.toISOString(),
      })),
    }))

    return NextResponse.json({
      user: {
        id: user.id,
        uid: user.uid.toString().padStart(3, '0'),
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isMember: user.isMember,
        skillLevel: user.skillLevel,
        createdAt: user.createdAt.toISOString(),
        isDefaultPassword,
      },
      bookingsSummary: {
        thisWeek: bookingsThisWeek,
        thisMonth: bookingsThisMonth,
        thisYear: bookingsThisYear,
        total: user.bookings.length,
        recurring: groupedRecurring.filter(g => g.isActive).length,
      },
      lessonsSummary: {
        thisWeek: lessonsThisWeek,
        thisMonth: lessonsThisMonth,
        thisYear: lessonsThisYear,
        scheduled: lessonsScheduled,
        completed: lessonsCompleted,
        cancelled: lessonsCancelled,
        total: lessonSessions.length,
      },
      paymentsSummary: {
        currentMonth: {
          totalDue: totalDueThisMonth,
          paid: paidThisMonth,
          unpaid: unpaidThisMonth,
          hours: totalHoursThisMonth,
        },
        allTime: {
          totalPaid: totalPaidAllTime + totalRecurringPaidAllTime,
        },
        recurring: {
          totalDue: recurringDueThisMonth,
          totalPaid: recurringPaidThisMonth,
          outstanding: recurringOutstanding,
        },
      },
      bookingsTimeline,
      recurringBookings,
      lessonsTimeline,
      paymentHistory,
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

// PATCH: Reset or set user password (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, newPassword } = body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let passwordToHash: string

    if (action === 'reset') {
      passwordToHash = DEFAULT_PASSWORD
    } else if (action === 'set' && newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }
      passwordToHash = newPassword
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "reset" or "set" with newPassword.' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(passwordToHash, 12)
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    const isDefault = action === 'reset'

    return NextResponse.json({
      message: isDefault ? 'Password reset to default' : 'Password updated',
      isDefaultPassword: isDefault,
    })
  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    )
  }
}
