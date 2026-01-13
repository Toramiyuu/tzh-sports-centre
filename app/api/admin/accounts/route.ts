import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for UID search
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (uid) {
      // Search by UID
      const user = await prisma.user.findFirst({
        where: { uid: BigInt(uid) },
        select: {
          id: true,
          uid: true,
          name: true,
          email: true,
          phone: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          ...user,
          uid: user.uid.toString(),
        },
      })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            recurringBookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Convert BigInt uid to string for JSON serialization
    const serializedUsers = users.map(user => ({
      ...user,
      uid: user.uid.toString(),
    }))

    return NextResponse.json({ users: serializedUsers })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

// PATCH - Update user UID (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, newUid } = body

    if (!userId || !newUid) {
      return NextResponse.json(
        { error: 'User ID and new UID are required' },
        { status: 400 }
      )
    }

    // Validate UID format (must be a positive number)
    const uidNumber = parseInt(newUid, 10)
    if (isNaN(uidNumber) || uidNumber <= 0) {
      return NextResponse.json(
        { error: 'UID must be a positive number' },
        { status: 400 }
      )
    }

    // Check if UID already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        uid: BigInt(uidNumber),
        id: { not: userId },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This UID is already in use by another user' },
        { status: 400 }
      )
    }

    // Update the UID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { uid: BigInt(uidNumber) },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        uid: updatedUser.uid.toString(),
      },
    })
  } catch (error) {
    console.error('Error updating UID:', error)
    return NextResponse.json(
      { error: 'Failed to update UID' },
      { status: 500 }
    )
  }
}
