import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }

    // Soft delete - anonymize user data but keep booking records
    await prisma.$transaction([
      // Anonymize user bookings (keep booking records but remove personal info)
      prisma.booking.updateMany({
        where: { userId: user.id },
        data: {
          userId: null,
          guestName: 'Deleted User',
          guestPhone: null,
          guestEmail: null,
        },
      }),
      // Remove user from lesson sessions
      prisma.lessonSession.updateMany({
        where: {
          students: {
            some: { id: user.id },
          },
        },
        data: {},
      }),
      // Delete lesson requests
      prisma.lessonRequest.deleteMany({
        where: { memberId: user.id },
      }),
      // Delete recurring bookings
      prisma.recurringBooking.deleteMany({
        where: { userId: user.id },
      }),
      // Soft delete user (mark as deleted)
      prisma.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          email: `deleted_${user.id}@deleted.local`,
          phone: `deleted_${user.id}`,
          name: 'Deleted User',
          passwordHash: 'DELETED',
        },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
