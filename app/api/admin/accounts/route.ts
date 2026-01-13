import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
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

    // Serialize BigInt uid to string
    const serializedUsers = users.map(u => ({
      ...u,
      uid: u.uid.toString(),
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
