import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        creditBalance: true,
        createdAt: true,
        isMember: true,
        notifyBookingConfirm: true,
        notifyBookingReminder: true,
        notifyCancellation: true,
        notifyLessonUpdates: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email, emergencyContact } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed
    let emailVerificationSent = false
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }

      // Generate verification token
      const verifyToken = crypto.randomUUID()
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: email,
          emailVerifyToken: verifyToken,
          emailVerifyExpiry: expiry,
        },
      })

      // TODO: Send verification email
      emailVerificationSent = true
    }

    // Check if phone is being changed and is unique
    if (phone && phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      })

      if (existingPhone && existingPhone.id !== user.id) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 })
      }
    }

    // Update profile (except email which requires verification)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        phone: phone || user.phone,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : user.emergencyContact,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        creditBalance: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ ...updatedUser, emailVerificationSent })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
