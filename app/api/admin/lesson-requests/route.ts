import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

// GET - Fetch all lesson requests
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.lessonRequest.findMany({
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// Lesson pricing configuration - RM50 per additional 30 min
const LESSON_PRICES: Record<string, { basePrice: number; minSlots: number; ratePerSlot: number }> = {
  '1-to-1': { basePrice: 130, minSlots: 3, ratePerSlot: 50 },
  '1-to-2': { basePrice: 160, minSlots: 3, ratePerSlot: 50 },
  '1-to-3': { basePrice: 180, minSlots: 4, ratePerSlot: 50 },
  '1-to-4': { basePrice: 200, minSlots: 4, ratePerSlot: 50 },
}

// Calculate price based on lesson type and duration in hours
function calculateLessonPrice(lessonType: string, durationHours: number): number {
  const config = LESSON_PRICES[lessonType]
  if (!config) return 0

  const slots = Math.round(durationHours * 2) // Convert hours to 30-min slots

  if (slots <= config.minSlots) {
    return config.basePrice
  }

  const additionalSlots = slots - config.minSlots
  return Math.round(config.basePrice + (additionalSlots * config.ratePerSlot))
}

// PATCH - Update request status (approve, reject, suggest different time)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, status, adminNotes, suggestedTime, courtId } = body

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'changed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // If approving, we need a court and will create a lesson session
    if (status === 'approved') {
      if (!courtId) {
        return NextResponse.json(
          { error: 'Court selection is required when approving' },
          { status: 400 }
        )
      }

      // Get the request details
      const lessonRequest = await prisma.lessonRequest.findUnique({
        where: { id: requestId },
        include: { member: true },
      })

      if (!lessonRequest) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        )
      }

      const lessonConfig = LESSON_PRICES[lessonRequest.lessonType]
      if (!lessonConfig) {
        return NextResponse.json(
          { error: 'Invalid lesson type' },
          { status: 400 }
        )
      }

      // Use the requested duration from the member's request
      const duration = lessonRequest.requestedDuration
      const price = calculateLessonPrice(lessonRequest.lessonType, duration)

      // Calculate end time based on requested duration
      const startTime = lessonRequest.requestedTime
      const [hours, minutes] = startTime.split(':').map(Number)
      const durationMinutes = duration * 60
      const endMinutes = minutes + durationMinutes
      const endHours = hours + Math.floor(endMinutes / 60)
      const endTime = `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

      const lessonDateObj = lessonRequest.requestedDate
      const dayOfWeek = lessonDateObj.getDay()

      // Check for regular booking conflicts
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

      // Check for recurring booking conflicts
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

      // Check for other lesson conflicts
      const conflictingLessons = await prisma.lessonSession.findFirst({
        where: {
          courtId,
          lessonDate: lessonDateObj,
          status: 'scheduled',
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

      // Create the lesson session
      const lesson = await prisma.lessonSession.create({
        data: {
          courtId,
          lessonDate: lessonRequest.requestedDate,
          startTime,
          endTime,
          lessonType: lessonRequest.lessonType,
          duration,
          price,
          status: 'scheduled',
          notes: adminNotes || null,
          students: {
            connect: [{ id: lessonRequest.memberId }],
          },
        },
        include: {
          court: true,
          students: true,
        },
      })

      // Update the request status
      const updatedRequest = await prisma.lessonRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          adminNotes: adminNotes || null,
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              skillLevel: true,
            },
          },
        },
      })

      return NextResponse.json({ request: updatedRequest, lesson })
    }

    // For other statuses (rejected, changed), just update the request
    const updateData: Record<string, unknown> = { status }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (suggestedTime) updateData.suggestedTime = suggestedTime

    const updatedRequest = await prisma.lessonRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}
