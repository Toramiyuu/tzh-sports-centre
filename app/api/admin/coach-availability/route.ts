import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

// GET - Fetch coach availability
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const availability = await prisma.coachAvailability.findMany({
      where: { isActive: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

// POST - Create coach availability
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { daysOfWeek, startTime, endTime, isRecurring, specificDate } = body

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      )
    }

    if (isRecurring && (!daysOfWeek || daysOfWeek.length === 0)) {
      return NextResponse.json(
        { error: 'Days of week are required for recurring availability' },
        { status: 400 }
      )
    }

    const createdAvailabilities = []

    if (isRecurring) {
      // Create availability for each selected day
      for (const dayOfWeek of daysOfWeek) {
        const availability = await prisma.coachAvailability.create({
          data: {
            dayOfWeek,
            startTime,
            endTime,
            isRecurring: true,
            isActive: true,
          },
        })
        createdAvailabilities.push(availability)
      }
    } else {
      // Create one-time availability
      const dayOfWeek = specificDate ? new Date(specificDate).getDay() : 0
      const availability = await prisma.coachAvailability.create({
        data: {
          dayOfWeek,
          startTime,
          endTime,
          isRecurring: false,
          specificDate: specificDate ? new Date(specificDate) : null,
          isActive: true,
        },
      })
      createdAvailabilities.push(availability)
    }

    return NextResponse.json(
      { availability: createdAvailabilities },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    )
  }
}

// DELETE - Remove coach availability
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    await prisma.coachAvailability.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    )
  }
}

// PATCH - Update coach availability
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, dayOfWeek, startTime, endTime } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      )
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const updated = await prisma.coachAvailability.update({
      where: { id },
      data: {
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : undefined,
        startTime,
        endTime,
      },
    })

    return NextResponse.json({ availability: updated })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}
