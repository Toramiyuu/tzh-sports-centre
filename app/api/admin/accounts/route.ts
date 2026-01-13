import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin, isSuperAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const DEFAULT_PASSWORD = 'temp1234'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        isAdmin: true,
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

    // Serialize BigInt uid to string and add superAdmin flag
    const serializedUsers = users.map(u => ({
      ...u,
      uid: u.uid.toString(),
      isAdmin: u.isAdmin || isSuperAdmin(u.email),
      isSuperAdmin: isSuperAdmin(u.email),
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

// POST - Admin creates a temporary account for a user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email } = body

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '')

    // Validate phone format (Malaysian)
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }
    }

    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

    // Generate a placeholder email if not provided (required by schema)
    const userEmail = email || `${cleanPhone}@temp.tzh.local`

    // Get the maximum UID and generate a new one
    const maxUidResult = await prisma.user.findFirst({
      select: { uid: true },
      orderBy: { uid: 'desc' },
    })
    const newUid = maxUidResult ? maxUidResult.uid + BigInt(1) : BigInt(100000001)

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        phone: cleanPhone,
        email: userEmail,
        passwordHash,
        uid: newUid,
      },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        uid: newUser.uid.toString(),
      },
      defaultPassword: DEFAULT_PASSWORD,
    })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

// PATCH - Update user UID
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

    // Check if UID is already in use
    const existingUser = await prisma.user.findUnique({
      where: { uid: BigInt(newUid) },
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'UID is already in use by another user' },
        { status: 400 }
      )
    }

    // Update the user's UID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { uid: BigInt(newUid) },
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

// PUT - Toggle admin status
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, isAdmin: makeAdmin } = body

    if (!userId || typeof makeAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and admin status are required' },
        { status: 400 }
      )
    }

    // Get the user to check if they're a superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent removing admin from superadmins
    if (!makeAdmin && isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Cannot remove admin status from superadmins' },
        { status: 400 }
      )
    }

    // Update the user's admin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: makeAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        isAdmin: updatedUser.isAdmin || isSuperAdmin(updatedUser.email),
        isSuperAdmin: isSuperAdmin(updatedUser.email),
      },
    })
  } catch (error) {
    console.error('Error toggling admin status:', error)
    return NextResponse.json(
      { error: 'Failed to update admin status' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get the user to check if they're a superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting superadmins
    if (isSuperAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Cannot delete superadmin accounts' },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (session.user.email === user.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete related records first (to avoid foreign key constraints)
    await prisma.lessonRequest.deleteMany({
      where: { memberId: userId },
    })

    await prisma.booking.deleteMany({
      where: { userId },
    })

    await prisma.recurringBooking.deleteMany({
      where: { userId },
    })

    // Remove user from lesson sessions (many-to-many)
    await prisma.user.update({
      where: { id: userId },
      data: {
        lessonSessions: {
          set: [],
        },
      },
    })

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      success: true,
      message: `User ${user.name} has been deleted`,
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
