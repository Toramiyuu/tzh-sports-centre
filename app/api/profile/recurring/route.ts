import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  groupRecurringSlots,
  countSessionsInMonth,
  getPaymentStatus,
  ensurePaymentRecords,
} from '@/lib/recurring-booking-utils'

interface PaymentRecord {
  id: string
  month: number
  year: number
  amount: number
  status: string
  paidAt: Date | null
  paymentMethod: string | null
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const recurringBookings = await prisma.recurringBooking.findMany({
      where: { userId: session.user.id },
      include: {
        court: true,
        payments: true,
      },
    })

    // Auto-generate missing payment records for current month
    const activeIds = recurringBookings.filter(rb => rb.isActive).map(rb => rb.id)
    if (activeIds.length > 0) {
      await ensurePaymentRecords(prisma as any, activeIds, currentMonth, currentYear)

      // Re-fetch payments
      const freshPayments = await prisma.recurringBookingPayment.findMany({
        where: { recurringBookingId: { in: recurringBookings.map(rb => rb.id) } },
      })
      for (const rb of recurringBookings) {
        rb.payments = freshPayments.filter(p => p.recurringBookingId === rb.id)
      }
    }

    const grouped = groupRecurringSlots(recurringBookings as any)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const result = grouped.map(group => {
      const sessionsCount = countSessionsInMonth(currentYear, currentMonth, group.dayOfWeek)
      const monthlyAmount = sessionsCount * group.amountPerSession

      // Current month payment status
      const currentMonthPayments = group.slots
        .map(slot => slot.payments?.find((p: PaymentRecord) => p.month === currentMonth && p.year === currentYear))
        .filter(Boolean) as PaymentRecord[]

      const allPaid = currentMonthPayments.length > 0 && currentMonthPayments.every((p: PaymentRecord) => p.status === 'paid')

      let currentMonthStatus: string
      if (allPaid) {
        currentMonthStatus = 'paid'
      } else if (currentMonthPayments.length > 0) {
        currentMonthStatus = getPaymentStatus(currentMonthPayments[0].status, currentMonth, currentYear)
      } else {
        currentMonthStatus = 'unpaid'
      }

      // Payment history
      const allPayments = group.slots.flatMap(slot =>
        (slot.payments || []).map((p: PaymentRecord) => ({
          month: p.month,
          year: p.year,
          amount: p.amount,
          status: getPaymentStatus(p.status, p.month, p.year),
          paidAt: p.paidAt?.toISOString() || null,
          paymentMethod: p.paymentMethod,
        }))
      )

      // Group by month
      type ProcessedPayment = typeof allPayments[number]
      const byMonth = new Map<string, ProcessedPayment[]>()
      for (const p of allPayments) {
        const key = `${p.year}-${p.month}`
        if (!byMonth.has(key)) byMonth.set(key, [])
        byMonth.get(key)!.push(p)
      }

      const history = Array.from(byMonth.entries())
        .map(([, payments]) => ({
          month: payments[0].month,
          year: payments[0].year,
          monthLabel: `${monthNames[payments[0].month]} ${payments[0].year}`,
          totalAmount: payments.reduce((s, p) => s + p.amount, 0),
          status: payments.every(p => p.status === 'paid') ? 'paid'
            : payments.some(p => p.status === 'overdue') ? 'overdue'
            : 'unpaid',
          paidAt: payments.find(p => p.paidAt)?.paidAt || null,
          paymentMethod: payments.find(p => p.paymentMethod)?.paymentMethod || null,
        }))
        .sort((a, b) => b.year - a.year || b.month - a.month)

      return {
        id: group.slotIds[0],
        schedule: days[group.dayOfWeek],
        time: `${group.startTime} - ${group.endTime}`,
        duration: group.duration,
        sport: group.sport,
        court: group.courtName,
        label: group.label,
        isActive: group.isActive,
        amountPerSession: group.amountPerSession,
        currentMonth: {
          status: currentMonthStatus,
          amount: monthlyAmount,
          sessionsCount,
        },
        history,
      }
    })

    return NextResponse.json({ recurringBookings: result })
  } catch (error) {
    console.error('Error fetching recurring bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring bookings' }, { status: 500 })
  }
}
