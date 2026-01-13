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
        bookings: {
          select: {
            id: true,
            bookingDate: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            sport: true,
            status: true,
            court: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { bookingDate: 'desc' },
          take: 10, // Last 10 bookings for history
        },
        recurringBookings: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            sport: true,
            label: true,
            startDate: true,
            endDate: true,
            isActive: true,
            court: {
              select: {
                name: true,
                hourlyRate: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            recurringBookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Helper function to calculate hours between two time strings
    const calculateHours = (startTime: string, endTime: string): number => {
      const parseTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours + minutes / 60
      }
      return parseTime(endTime) - parseTime(startTime)
    }

    // Calculate total spent and combined booking count for each user
    const serializedUsers = users.map(u => {
      // Calculate total spent from regular bookings
      const regularSpent = u.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

      // Calculate recurring booking instances and cost
      let recurringInstances = 0
      let recurringSpent = 0

      for (const rb of u.recurringBookings) {
        if (!rb.isActive) continue

        const startDate = new Date(rb.startDate)
        const endDate = rb.endDate ? new Date(rb.endDate) : new Date()
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const sessionCount = Math.max(weeks, 1)

        recurringInstances += sessionCount

        // Calculate cost: hours per session × hourly rate × number of sessions
        const hoursPerSession = calculateHours(rb.startTime, rb.endTime)
        const sessionCost = hoursPerSession * rb.court.hourlyRate
        recurringSpent += sessionCost * sessionCount
      }

      const totalSpent = regularSpent + recurringSpent

      return {
        id: u.id,
        uid: u.uid.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        isAdmin: u.isAdmin || isSuperAdmin(u.email),
        isSuperAdmin: isSuperAdmin(u.email),
        createdAt: u.createdAt,
        totalSpent,
        regularSpent,
        recurringSpent,
        totalBookings: u._count.bookings + recurringInstances,
        regularBookings: u._count.bookings,
        recurringBookingsCount: u._count.recurringBookings,
        recurringInstances,
        recentBookings: u.bookings.map(b => ({
          ...b,
          courtName: b.court.name,
        })),
        recurringBookings: u.recurringBookings.map(rb => ({
          ...rb,
          courtName: rb.court.name,
        })),
        _count: u._count,
      }
    })

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

// DELETE - Delete user account(s) - supports single or bulk deletion
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, userIds } = body

    // Support both single deletion (userId) and bulk deletion (userIds)
    const idsToDelete: string[] = userIds || (userId ? [userId] : [])

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'User ID(s) required' },
        { status: 400 }
      )
    }

    // Get all users to check permissions
    const users = await prisma.user.findMany({
      where: { id: { in: idsToDelete } },
      select: { id: true, email: true, name: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404 }
      )
    }

    // Check for superadmins and self-deletion
    const skipped: string[] = []
    const toDelete: string[] = []

    for (const user of users) {
      if (isSuperAdmin(user.email)) {
        skipped.push(`${user.name} (superadmin)`)
      } else if (session.user.email === user.email) {
        skipped.push(`${user.name} (self)`)
      } else {
        toDelete.push(user.id)
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json(
        { error: 'No users can be deleted', skipped },
        { status: 400 }
      )
    }

    // Delete related records first (to avoid foreign key constraints)
    await prisma.lessonRequest.deleteMany({
      where: { memberId: { in: toDelete } },
    })

    await prisma.booking.deleteMany({
      where: { userId: { in: toDelete } },
    })

    await prisma.recurringBooking.deleteMany({
      where: { userId: { in: toDelete } },
    })

    // Remove users from lesson sessions (many-to-many)
    for (const id of toDelete) {
      await prisma.user.update({
        where: { id },
        data: {
          lessonSessions: {
            set: [],
          },
        },
      })
    }

    // Delete the users
    await prisma.user.deleteMany({
      where: { id: { in: toDelete } },
    })

    return NextResponse.json({
      success: true,
      deleted: toDelete.length,
      skipped: skipped.length > 0 ? skipped : undefined,
      message: `${toDelete.length} user(s) deleted`,
    })
  } catch (error) {
    console.error('Error deleting account(s):', error)
    return NextResponse.json(
      { error: 'Failed to delete account(s)' },
      { status: 500 }
    )
  }
}
