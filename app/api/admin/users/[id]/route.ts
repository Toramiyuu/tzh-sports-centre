import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

// Peak hour pricing constants
const BADMINTON_RATE = 15
const BADMINTON_PEAK_RATE = 18
const PICKLEBALL_RATE = 25
const PEAK_START_TIME = '18:00'

// Calculate booking amount with peak hour support
function calculateBookingAmount(startTime: string, endTime: string, sport: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const hours = (endMinutes - startMinutes) / 60

  if (sport.toLowerCase() === 'pickleball') {
    return hours * PICKLEBALL_RATE
  }

  const peakMinutes = 18 * 60

  if (endMinutes <= peakMinutes) {
    return hours * BADMINTON_RATE
  } else if (startMinutes >= peakMinutes) {
    return hours * BADMINTON_PEAK_RATE
  } else {
    const hoursBeforePeak = (peakMinutes - startMinutes) / 60
    const hoursAfterPeak = (endMinutes - peakMinutes) / 60
    return (hoursBeforePeak * BADMINTON_RATE) + (hoursAfterPeak * BADMINTON_PEAK_RATE)
  }
}

function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60
}

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
          include: { court: true },
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

    // Fetch lesson sessions for this user
    const lessonSessions = await prisma.lessonSession.findMany({
      where: {
        students: { some: { id } },
      },
      include: { court: true, students: true },
      orderBy: { lessonDate: 'desc' },
    })

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
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Calculate total due for current month
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

    // Add recurring booking sessions for this month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    for (const rb of user.recurringBookings.filter(rb => rb.isActive)) {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day)
        if (date.getDay() === rb.dayOfWeek && date >= monthStart && date <= monthEnd) {
          const amount = rb.hourlyRate
            ? calculateHours(rb.startTime, rb.endTime) * rb.hourlyRate
            : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport)
          totalDueThisMonth += amount
          totalHoursThisMonth += calculateHours(rb.startTime, rb.endTime)
        }
      }
    }

    const currentMonthPayment = user.monthlyPayments.find(
      mp => mp.month === currentMonth && mp.year === currentYear
    )
    const paidThisMonth = currentMonthPayment?.paidAmount || 0
    const unpaidThisMonth = totalDueThisMonth - paidThisMonth

    // Calculate all-time totals
    const totalPaidAllTime = user.monthlyPayments.reduce((sum, mp) => sum + mp.paidAmount, 0)

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

    // Format recurring bookings
    const recurringBookings = user.recurringBookings.map(rb => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const amount = rb.hourlyRate
        ? calculateHours(rb.startTime, rb.endTime) * rb.hourlyRate
        : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport)
      return {
        id: rb.id,
        schedule: `Every ${days[rb.dayOfWeek]}`,
        time: `${rb.startTime} - ${rb.endTime}`,
        duration: calculateHours(rb.startTime, rb.endTime),
        sport: rb.sport,
        court: rb.court.name,
        label: rb.label,
        isActive: rb.isActive,
        startDate: rb.startDate.toISOString().split('T')[0],
        endDate: rb.endDate?.toISOString().split('T')[0] || null,
        amountPerSession: amount,
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
      },
      bookingsSummary: {
        thisWeek: bookingsThisWeek,
        thisMonth: bookingsThisMonth,
        thisYear: bookingsThisYear,
        total: user.bookings.length,
        recurring: user.recurringBookings.filter(rb => rb.isActive).length,
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
          totalPaid: totalPaidAllTime,
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
