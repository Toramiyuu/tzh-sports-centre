import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Retrieve user's in-app notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 })
  }
}

// PATCH: Update notification preferences or mark notifications as read
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Handle marking notifications as read
    if (body.markAsRead) {
      const { notificationIds, markAllAsRead } = body

      if (markAllAsRead) {
        await prisma.notification.updateMany({
          where: { userId: session.user.id, isRead: false },
          data: { isRead: true },
        })
      } else if (notificationIds && Array.isArray(notificationIds)) {
        await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
          },
          data: { isRead: true },
        })
      }

      return NextResponse.json({ success: true })
    }

    // Handle notification preferences update
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
