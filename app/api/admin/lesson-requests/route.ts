import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

// GET - Fetch all lesson requests
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.lessonRequest.findMany({
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// PATCH - Update request status (approve, reject, suggest different time)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, status, adminNotes, suggestedTime } = body

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'changed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (suggestedTime) updateData.suggestedTime = suggestedTime

    const updatedRequest = await prisma.lessonRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}
