import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import {
  getLessonType,
  getLessonPrice,
  getDefaultDuration,
  isMonthlyBilling,
} from '@/lib/lesson-config'

// GET - Fetch lessons (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const month = searchParams.get('month') // Format: YYYY-MM
    const memberId = searchParams.get('memberId')

    const where: Record<string, unknown> = {}

    if (date) {
      where.lessonDate = new Date(date)
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const startOfMonth = new Date(year, monthNum - 1, 1)
      const endOfMonth = new Date(year, monthNum, 0)
      where.lessonDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      }
    }

    if (memberId) {
      where.students = {
        some: { id: memberId },
      }
    }

    const lessons = await prisma.lessonSession.findMany({
      where,
      include: {
        court: true,
        students: {
          select: {
            id: true,
            name: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
      orderBy: [
        { lessonDate: 'desc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}

// POST - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courtId, lessonDate, startTime, lessonType, duration, studentIds, notes } = body

    if (!courtId || !lessonDate || !startTime || !lessonType || !studentIds || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Court, date, time, lesson type, and at least one student are required' },
        { status: 400 }
      )
    }

    // Validate lesson type
    const lessonTypeConfig = getLessonType(lessonType)
    if (!lessonTypeConfig) {
      return NextResponse.json(
        { error: 'Invalid lesson type' },
        { status: 400 }
      )
    }

    // Determine billing type
    const billingType = lessonTypeConfig.billingType

    // Use provided duration or default for this lesson type
    const lessonDuration = duration || getDefaultDuration(lessonType)

    // Validate duration based on lesson type
    if (billingType === 'per_session') {
      // Per-session lessons must use allowed durations
      if (!lessonTypeConfig.allowedDurations.includes(lessonDuration)) {
        return NextResponse.json(
          { error: `Invalid duration for ${lessonTypeConfig.label}. Allowed: ${lessonTypeConfig.allowedDurations.join(', ')} hours` },
          { status: 400 }
        )
      }
    }

    // Validate student count
    if (studentIds.length > lessonTypeConfig.maxStudents) {
      return NextResponse.json(
        { error: `${lessonTypeConfig.label} allows maximum ${lessonTypeConfig.maxStudents} student(s)` },
        { status: 400 }
      )
    }

    // Calculate end time based on duration
    const [hours, minutes] = startTime.split(':').map(Number)
    const durationMinutes = lessonDuration * 60
    const endMinutes = minutes + durationMinutes
    const endHours = hours + Math.floor(endMinutes / 60)
    const endTime = `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    // Check for conflicts - regular bookings, recurring bookings, and other lessons
    const lessonDateObj = new Date(lessonDate)
    const dayOfWeek = lessonDateObj.getDay()

    // Check regular bookings conflict
    const conflictingBookings = await prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: lessonDateObj,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    })

    if (conflictingBookings) {
      return NextResponse.json(
        { error: 'This time slot conflicts with an existing booking' },
        { status: 409 }
      )
    }

    // Check recurring bookings conflict
    const timeSlots = await prisma.timeSlot.findMany({ orderBy: { id: 'asc' } })
    const allSlotTimes = timeSlots.map(s => s.slotTime)
    const startIdx = allSlotTimes.indexOf(startTime)
    const endIdx = allSlotTimes.indexOf(endTime)
    const lessonSlots = startIdx !== -1 && endIdx !== -1
      ? allSlotTimes.slice(startIdx, endIdx)
      : [startTime]

    const conflictingRecurring = await prisma.recurringBooking.findFirst({
      where: {
        courtId,
        dayOfWeek,
        startTime: { in: lessonSlots },
        isActive: true,
        startDate: { lte: lessonDateObj },
        OR: [
          { endDate: null },
          { endDate: { gte: lessonDateObj } },
        ],
      },
    })

    if (conflictingRecurring) {
      return NextResponse.json(
        { error: 'This time slot conflicts with a recurring booking' },
        { status: 409 }
      )
    }

    // Check other lessons conflict
    const conflictingLessons = await prisma.lessonSession.findFirst({
      where: {
        courtId,
        lessonDate: lessonDateObj,
        status: { in: ['scheduled'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    })

    if (conflictingLessons) {
      return NextResponse.json(
        { error: 'This time slot conflicts with another lesson' },
        { status: 409 }
      )
    }

    // Calculate price using the centralized config
    const price = getLessonPrice(lessonType, lessonDuration)

    // Create the lesson
    const lesson = await prisma.lessonSession.create({
      data: {
        courtId,
        lessonDate: lessonDateObj,
        startTime,
        endTime,
        lessonType,
        billingType,
        duration: lessonDuration,
        price,
        status: 'scheduled',
        notes,
        students: {
          connect: studentIds.map((id: string) => ({ id })),
        },
      },
      include: {
        court: true,
        students: {
          select: {
            id: true,
            name: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}

// PATCH - Update lesson status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId, status, notes } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const lesson = await prisma.lessonSession.update({
      where: { id: lessonId },
      data: updateData,
      include: {
        court: true,
        students: {
          select: {
            id: true,
            name: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel a lesson
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    await prisma.lessonSession.update({
      where: { id: lessonId },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling lesson:', error)
    return NextResponse.json(
      { error: 'Failed to cancel lesson' },
      { status: 500 }
    )
  }
}
