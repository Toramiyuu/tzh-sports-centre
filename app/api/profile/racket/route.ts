import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/profile/racket - Get user's racket profile(s)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { racketProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return the default racket or first one for backwards compatibility
    const racketProfiles = user.racketProfile || []
    const defaultRacket = racketProfiles.find(r => r.isDefault) || racketProfiles[0] || null

    return NextResponse.json({
      racketProfile: defaultRacket,
      racketProfiles: racketProfiles
    })
  } catch (error) {
    console.error('Error fetching racket profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch racket profile' },
      { status: 500 }
    )
  }
}

// POST /api/profile/racket - Create racket profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { brand, model, weight, shaftNumber, tensionMain, tensionCross } = body

    // Validate required fields
    if (!brand || !model || !weight) {
      return NextResponse.json(
        { error: 'Brand, model, and weight are required' },
        { status: 400 }
      )
    }

    const racketProfile = await prisma.racketProfile.create({
      data: {
        userId: user.id,
        brand,
        model,
        color: '', // Not used anymore but required in schema
        weight,
        shaftNumber: shaftNumber || null,
        tensionMain: tensionMain || null,
        tensionCross: tensionCross || null,
      },
    })

    return NextResponse.json({ racketProfile })
  } catch (error) {
    console.error('Error creating racket profile:', error)
    return NextResponse.json(
      { error: 'Failed to create racket profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile/racket - Update racket profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { racketProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const racketProfiles = user.racketProfile || []
    if (racketProfiles.length === 0) {
      return NextResponse.json({ error: 'No racket profile found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, brand, model, weight, shaftNumber, tensionMain, tensionCross, isDefault } = body

    // Validate required fields
    if (!brand || !model || !weight) {
      return NextResponse.json(
        { error: 'Brand, model, and weight are required' },
        { status: 400 }
      )
    }

    // Determine which racket to update - use provided id or default/first racket
    const racketId = id || racketProfiles.find(r => r.isDefault)?.id || racketProfiles[0].id

    // Verify the racket belongs to this user
    const targetRacket = racketProfiles.find(r => r.id === racketId)
    if (!targetRacket) {
      return NextResponse.json({ error: 'Racket not found' }, { status: 404 })
    }

    // If setting as default, unset all other rackets first
    if (isDefault) {
      await prisma.racketProfile.updateMany({
        where: { userId: user.id, id: { not: racketId } },
        data: { isDefault: false }
      })
    }

    const racketProfile = await prisma.racketProfile.update({
      where: { id: racketId },
      data: {
        brand,
        model,
        weight,
        shaftNumber: shaftNumber || null,
        tensionMain: tensionMain || null,
        tensionCross: tensionCross || null,
        isDefault: isDefault ?? targetRacket.isDefault,
      },
    })

    return NextResponse.json({ racketProfile })
  } catch (error) {
    console.error('Error updating racket profile:', error)
    return NextResponse.json(
      { error: 'Failed to update racket profile' },
      { status: 500 }
    )
  }
}
