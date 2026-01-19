import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/profile/racket - Get user's racket profile
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

    return NextResponse.json({ racketProfile: user.racketProfile })
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

    if (!user.racketProfile) {
      return NextResponse.json({ error: 'No racket profile found' }, { status: 404 })
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

    const racketProfile = await prisma.racketProfile.update({
      where: { userId: user.id },
      data: {
        brand,
        model,
        weight,
        shaftNumber: shaftNumber || null,
        tensionMain: tensionMain || null,
        tensionCross: tensionCross || null,
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
