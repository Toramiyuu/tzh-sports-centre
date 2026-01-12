import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch coach's availability for members to see
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and check if they're a member
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isMember: true },
    })

    if (!user || !user.isMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    // Get recurring availability for this day
    const recurringAvailability = await prisma.coachAvailability.findMany({
      where: {
        dayOfWeek,
        isRecurring: true,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    })

    // Get one-time availability for this specific date
    const specificAvailability = await prisma.coachAvailability.findMany({
      where: {
        isRecurring: false,
        specificDate: targetDate,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    })

    // Get already scheduled lessons for this date
    const scheduledLessons = await prisma.lessonSession.findMany({
      where: {
        lessonDate: targetDate,
        status: 'scheduled',
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Combine availability
    const availability = [...recurringAvailability, ...specificAvailability]

    return NextResponse.json({
      availability,
      scheduledLessons,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
