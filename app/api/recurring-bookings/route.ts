import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

// GET - List all recurring bookings (admin only)
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringBookings = await prisma.recurringBooking.findMany({
      where: { isActive: true },
      include: {
        court: true,
        user: {
          select: {
            id: true,
            uid: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    })

    // Convert BigInt uid to 3-digit string
    const serialized = recurringBookings.map(rb => ({
      ...rb,
      user: rb.user ? {
        ...rb.user,
        uid: rb.user.uid.toString().padStart(3, '0'),
      } : null,
    }))

    return NextResponse.json({ recurringBookings: serialized })
  } catch (error) {
    console.error('Error fetching recurring bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring bookings' },
      { status: 500 }
    )
  }
}

// POST - Create a recurring booking
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const {
      // New format: arrays for multi-select
      courtIds,
      daysOfWeek,
      // Legacy format: single values (for customer booking page)
      courtId,
      dayOfWeek,
      sport,
      startTime,
      endTime,
      startDate,
      endDate,
      label,
      // For customer recurring bookings
      guestName,
      guestPhone,
      isAdminBooking,
      // For pickleball - number of consecutive hours (legacy)
      consecutiveHours,
      // For admin creating bookings for other users
      userId,
    } = body

    // Handle both new array format and legacy single value format
    const courts = courtIds || (courtId !== undefined ? [courtId] : [])
    const days = daysOfWeek || (dayOfWeek !== undefined ? [dayOfWeek] : [])

    // Validate required fields
    if (courts.length === 0 || days.length === 0 || !startTime || !sport) {
      return NextResponse.json(
        { error: 'Court(s), day(s) of week, start time, and sport are required' },
        { status: 400 }
      )
    }

    // Admin bookings require admin privileges
    if (isAdminBooking && (!session?.user || !isAdmin(session.user.email, session.user.isAdmin))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Customer recurring bookings require name and phone
    if (!isAdminBooking && (!guestName || !guestPhone)) {
      return NextResponse.json(
        { error: 'Name and phone are required for recurring bookings' },
        { status: 400 }
      )
    }

    // Get time slots to calculate end times and validate
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { id: 'asc' },
    })

    const startSlotIndex = timeSlots.findIndex(s => s.slotTime === startTime)
    if (startSlotIndex === -1) {
      return NextResponse.json(
        { error: `Invalid start time: ${startTime}` },
        { status: 400 }
      )
    }

    // Calculate all time slots between start and end
    const slotsToBook: string[] = []

    if (endTime) {
      // New format: explicit end time provided
      for (let i = startSlotIndex; i < timeSlots.length; i++) {
        if (timeSlots[i].slotTime >= endTime) break
        slotsToBook.push(timeSlots[i].slotTime)
      }
    } else if (consecutiveHours) {
      // Legacy format: consecutive hours
      for (let i = 0; i < consecutiveHours && startSlotIndex + i < timeSlots.length; i++) {
        slotsToBook.push(timeSlots[startSlotIndex + i].slotTime)
      }
    } else {
      // Single hour
      slotsToBook.push(startTime)
    }

    if (slotsToBook.length === 0) {
      return NextResponse.json(
        { error: 'Invalid time range' },
        { status: 400 }
      )
    }

    // Create bookings for each combination of court, day, and time slot
    const bookingsToCreate = []
    const conflicts: string[] = []

    for (const cId of courts) {
      for (const dow of days) {
        for (const slotTime of slotsToBook) {
          // Check for existing booking
          const existing = await prisma.recurringBooking.findFirst({
            where: {
              courtId: cId,
              dayOfWeek: dow,
              startTime: slotTime,
              isActive: true,
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
              ],
            },
          })

          if (existing) {
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow]
            conflicts.push(`Court ${cId}, ${dayName}, ${slotTime}`)
            continue
          }

          // Calculate end time for this slot
          const slotIndex = timeSlots.findIndex(s => s.slotTime === slotTime)
          const nextSlot = slotIndex + 1 < timeSlots.length ? timeSlots[slotIndex + 1].slotTime : '24:00'

          bookingsToCreate.push({
            courtId: cId,
            sport,
            dayOfWeek: dow,
            startTime: slotTime,
            endTime: nextSlot,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            label: isAdminBooking ? label : null,
            // For admin bookings: use provided userId if available, otherwise null (don't default to admin's ID)
            // For customer bookings: use their session ID
            userId: isAdminBooking ? (userId || null) : (session?.user?.id || null),
            // Guest info: save for both admin and customer bookings when provided
            guestName: guestName || null,
            guestPhone: guestPhone || null,
            createdBy: isAdminBooking ? session?.user?.email : null,
            isActive: true,
          })
        }
      }
    }

    if (bookingsToCreate.length === 0) {
      return NextResponse.json(
        { error: `All slots have conflicts: ${conflicts.join(', ')}` },
        { status: 400 }
      )
    }

    // Create all recurring bookings
    const createdBookings = await prisma.$transaction(
      bookingsToCreate.map(data => prisma.recurringBooking.create({ data }))
    )

    return NextResponse.json({
      success: true,
      count: createdBookings.length,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      recurringBookings: createdBookings,
    })
  } catch (error) {
    console.error('Error creating recurring booking:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring booking' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate a recurring booking
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ids } = body

    // Support single ID or array of IDs
    const bookingIds = ids || (id ? [id] : [])

    if (bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Recurring booking ID(s) required' },
        { status: 400 }
      )
    }

    await prisma.recurringBooking.updateMany({
      where: { id: { in: bookingIds } },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, deactivated: bookingIds.length })
  } catch (error) {
    console.error('Error deactivating recurring booking:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate recurring booking' },
      { status: 500 }
    )
  }
}

// PATCH - Update a recurring booking
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      label,
      dayOfWeek,
      startTime,
      endTime,
      endDate,
      courtId,
      userId,
      guestName,
      guestPhone,
      hourlyRate,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Recurring booking ID is required' },
        { status: 400 }
      )
    }

    // Check if booking exists
    const existing = await prisma.recurringBooking.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring booking not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: {
      label?: string | null
      dayOfWeek?: number
      startTime?: string
      endTime?: string
      endDate?: Date | null
      courtId?: number
      userId?: string | null
      guestName?: string | null
      guestPhone?: string | null
      hourlyRate?: number | null
    } = {}

    if (label !== undefined) updateData.label = label
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (courtId !== undefined) updateData.courtId = courtId
    if (userId !== undefined) updateData.userId = userId
    if (guestName !== undefined) updateData.guestName = guestName
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate

    // Check for conflicts if changing day, time, or court
    if (dayOfWeek !== undefined || startTime !== undefined || courtId !== undefined) {
      const checkDayOfWeek = dayOfWeek ?? existing.dayOfWeek
      const checkStartTime = startTime ?? existing.startTime
      const checkCourtId = courtId ?? existing.courtId

      const conflict = await prisma.recurringBooking.findFirst({
        where: {
          id: { not: id },
          courtId: checkCourtId,
          dayOfWeek: checkDayOfWeek,
          startTime: checkStartTime,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
      })

      if (conflict) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDayOfWeek]
        return NextResponse.json(
          { error: `Conflict exists for Court ${checkCourtId}, ${dayName}, ${checkStartTime}` },
          { status: 400 }
        )
      }
    }

    const updatedBooking = await prisma.recurringBooking.update({
      where: { id },
      data: updateData,
      include: {
        court: true,
        user: {
          select: {
            id: true,
            uid: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Serialize BigInt
    const serialized = {
      ...updatedBooking,
      user: updatedBooking.user ? {
        ...updatedBooking.user,
        uid: updatedBooking.user.uid.toString().padStart(3, '0'),
      } : null,
    }

    return NextResponse.json({ success: true, recurringBooking: serialized })
  } catch (error) {
    console.error('Error updating recurring booking:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring booking' },
      { status: 500 }
    )
  }
}
