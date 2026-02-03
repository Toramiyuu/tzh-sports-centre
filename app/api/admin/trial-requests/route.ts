import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

// GET - Fetch all trial requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // Filter by status

    const trialRequests = await prisma.trialRequest.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    })

    // Get counts by status
    const counts = await prisma.trialRequest.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const statusCounts = counts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      requests: trialRequests,
      counts: statusCounts,
      total: trialRequests.length,
    })
  } catch (error) {
    console.error('Error fetching trial requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trial requests' },
      { status: 500 }
    )
  }
}

// PATCH - Update a trial request status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      handledBy: session.user.email,
      updatedAt: new Date(),
    }

    if (status) {
      updateData.status = status
      // Set contactedAt when status changes from 'new'
      if (status !== 'new') {
        const existing = await prisma.trialRequest.findUnique({ where: { id } })
        if (existing?.status === 'new') {
          updateData.contactedAt = new Date()
        }
      }
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const updated = await prisma.trialRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      request: updated,
    })
  } catch (error) {
    console.error('Error updating trial request:', error)
    return NextResponse.json(
      { error: 'Failed to update trial request' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a trial request (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    await prisma.trialRequest.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Trial request deleted',
    })
  } catch (error) {
    console.error('Error deleting trial request:', error)
    return NextResponse.json(
      { error: 'Failed to delete trial request' },
      { status: 500 }
    )
  }
}
