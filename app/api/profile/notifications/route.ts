import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingConfirm, bookingReminder, cancellation, lessonUpdates } = body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build update object with only provided fields
    const updateData: Record<string, boolean> = {}

    if (bookingConfirm !== undefined) {
      updateData.notifyBookingConfirm = bookingConfirm
    }
    if (bookingReminder !== undefined) {
      updateData.notifyBookingReminder = bookingReminder
    }
    if (cancellation !== undefined) {
      updateData.notifyCancellation = cancellation
    }
    if (lessonUpdates !== undefined) {
      updateData.notifyLessonUpdates = lessonUpdates
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        notifyBookingConfirm: true,
        notifyBookingReminder: true,
        notifyCancellation: true,
        notifyLessonUpdates: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
