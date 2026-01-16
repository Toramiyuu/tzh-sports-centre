import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch coach's availability and scheduled lessons for an entire week
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and check if they're a member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isMember: true },
    })

    if (!user || !user.isMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get('startDate')

    if (!startDateStr) {
      return NextResponse.json(
        { error: 'startDate is required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)

    // Get all courts
    const courts = await prisma.court.findMany({
      select: { id: true },
    })
    const totalCourts = courts.length

    // Get all recurring coach availability
    const recurringAvailability = await prisma.coachAvailability.findMany({
      where: {
        isRecurring: true,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    })

    // Get one-time availability for this week
    const specificAvailability = await prisma.coachAvailability.findMany({
      where: {
        isRecurring: false,
        isActive: true,
        specificDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Get all scheduled lessons for this week
    const scheduledLessons = await prisma.lessonSession.findMany({
      where: {
        lessonDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['scheduled', 'completed'],
        },
      },
      select: {
        id: true,
        courtId: true,
        lessonDate: true,
        startTime: true,
        endTime: true,
        lessonType: true,
        status: true,
        students: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { lessonDate: 'asc' },
        { startTime: 'asc' },
      ],
    })

    // Get all regular bookings for this week
    const regularBookings = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['confirmed', 'paid'],
        },
      },
      select: {
        courtId: true,
        bookingDate: true,
        startTime: true,
      },
    })

    // Get all recurring bookings (these apply to specific days of week)
    const recurringBookings = await prisma.recurringBooking.findMany({
      where: {
        isActive: true,
      },
      select: {
        courtId: true,
        dayOfWeek: true,
        startTime: true,
      },
    })

    // Get member's pending requests for this week
    const pendingRequests = await prisma.lessonRequest.findMany({
      where: {
        memberId: session.user.id,
        status: 'pending',
        requestedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        requestedDate: true,
        requestedTime: true,
        requestedDuration: true,
        lessonType: true,
      },
      orderBy: [
        { requestedDate: 'asc' },
        { requestedTime: 'asc' },
      ],
    })

    // Get coach-suggested requests (status = 'changed') for this member
    // These have a suggested time that may be different from the original
    const coachSuggestedRequests = await prisma.lessonRequest.findMany({
      where: {
        memberId: session.user.id,
        status: 'changed',
      },
      select: {
        id: true,
        requestedDate: true,
        requestedTime: true,
        requestedDuration: true,
        lessonType: true,
        suggestedTime: true,
        adminNotes: true,
      },
    })

    // Build the response organized by date
    const days: Record<string, {
      dayOfWeek: number
      coachAvailability: { startTime: string; endTime: string }[]
      scheduledLessons: {
        id: string
        startTime: string
        endTime: string
        lessonType: string
        status: string
        isMine: boolean
      }[]
      pendingRequests: {
        id: string
        requestedTime: string
        requestedDuration: number
        lessonType: string
      }[]
      coachSuggestedRequests: {
        id: string
        originalDate: string
        originalTime: string
        suggestedDate: string
        suggestedTime: string
        requestedDuration: number
        lessonType: string
        adminNotes: string | null
      }[]
      fullyBookedSlots: string[] // Time slots where all courts are booked
    }> = {}

    // Generate time slots from 9 AM to 11:30 PM in 30-min increments
    const timeSlots: string[] = []
    for (let hour = 9; hour <= 23; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = formatDateString(date)
      const dayOfWeek = date.getDay()

      // Get recurring availability for this day of week
      const dayRecurring = recurringAvailability
        .filter(a => a.dayOfWeek === dayOfWeek)
        .map(a => ({ startTime: a.startTime, endTime: a.endTime }))

      // Get specific availability for this exact date
      const daySpecific = specificAvailability
        .filter(a => {
          if (!a.specificDate) return false
          const specificDateStr = formatDateString(new Date(a.specificDate))
          return specificDateStr === dateStr
        })
        .map(a => ({ startTime: a.startTime, endTime: a.endTime }))

      // Combine availability
      const coachAvailability = [...dayRecurring, ...daySpecific]

      // Get lessons for this day
      const dayLessons = scheduledLessons
        .filter(l => formatDateString(new Date(l.lessonDate)) === dateStr)
        .map(l => ({
          id: l.id,
          startTime: l.startTime,
          endTime: l.endTime,
          lessonType: l.lessonType,
          status: l.status,
          isMine: l.students.some(s => s.id === session?.user?.id),
        }))

      // Get pending requests for this day
      const dayRequests = pendingRequests
        .filter(r => formatDateString(new Date(r.requestedDate)) === dateStr)
        .map(r => ({
          id: r.id,
          requestedTime: r.requestedTime,
          requestedDuration: r.requestedDuration,
          lessonType: r.lessonType,
        }))

      // Get coach-suggested requests where the SUGGESTED date matches this day
      const daySuggestions = coachSuggestedRequests
        .filter(r => {
          if (!r.suggestedTime) return false
          // suggestedTime format: "YYYY-MM-DD HH:MM"
          const suggestedDateStr = r.suggestedTime.split(' ')[0]
          return suggestedDateStr === dateStr
        })
        .map(r => {
          // Parse suggested time: "YYYY-MM-DD HH:MM"
          const [suggestedDatePart, suggestedTimePart] = r.suggestedTime!.split(' ')
          return {
            id: r.id,
            originalDate: formatDateString(new Date(r.requestedDate)),
            originalTime: r.requestedTime,
            suggestedDate: suggestedDatePart,
            suggestedTime: suggestedTimePart,
            requestedDuration: r.requestedDuration,
            lessonType: r.lessonType,
            adminNotes: r.adminNotes,
          }
        })

      // Calculate fully booked slots (all courts are occupied)
      const fullyBookedSlots: string[] = []

      if (totalCourts > 0) {
        // Get regular bookings for this day
        const dayRegularBookings = regularBookings.filter(b =>
          formatDateString(new Date(b.bookingDate)) === dateStr
        )

        // Get recurring bookings for this day of week
        const dayRecurringBookings = recurringBookings.filter(rb =>
          rb.dayOfWeek === dayOfWeek
        )

        // Get lessons for this day (they also occupy courts)
        const dayLessonBookings = scheduledLessons.filter(l =>
          formatDateString(new Date(l.lessonDate)) === dateStr
        )

        // Check each time slot
        for (const slotTime of timeSlots) {
          let bookedCourtsCount = 0
          const bookedCourtIds = new Set<number>()

          // Check regular bookings
          for (const booking of dayRegularBookings) {
            if (booking.startTime === slotTime) {
              bookedCourtIds.add(booking.courtId)
            }
          }

          // Check recurring bookings
          for (const recurring of dayRecurringBookings) {
            if (recurring.startTime === slotTime) {
              bookedCourtIds.add(recurring.courtId)
            }
          }

          // Check lessons (they span multiple slots)
          for (const lesson of dayLessonBookings) {
            // Check if this slot falls within the lesson time range
            if (slotTime >= lesson.startTime && slotTime < lesson.endTime) {
              bookedCourtIds.add(lesson.courtId)
            }
          }

          bookedCourtsCount = bookedCourtIds.size

          // If all courts are booked, mark this slot as fully booked
          if (bookedCourtsCount >= totalCourts) {
            fullyBookedSlots.push(slotTime)
          }
        }
      }

      days[dateStr] = {
        dayOfWeek,
        coachAvailability,
        scheduledLessons: dayLessons,
        pendingRequests: dayRequests,
        coachSuggestedRequests: daySuggestions,
        fullyBookedSlots,
      }
    }

    return NextResponse.json({
      weekStart: formatDateString(startDate),
      weekEnd: formatDateString(endDate),
      days,
    })
  } catch (error) {
    console.error('Error fetching weekly availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly availability' },
      { status: 500 }
    )
  }
}

// Helper function to format date as YYYY-MM-DD
function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
