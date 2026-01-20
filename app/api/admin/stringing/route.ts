import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const time = searchParams.get('time')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      // Include both 'pending' and 'pending_verification' for pending filter
      if (status === 'pending') {
        where.paymentStatus = { in: ['pending', 'pending_verification'] }
      } else {
        where.paymentStatus = status
      }
    }

    // Add time filter
    if (time && time !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (time) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0) // Very old date if unknown filter
      }

      where.createdAt = { gte: startDate }
    }

    // Get all stringing orders
    const ordersRaw = await prisma.stringingOrder.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert BigInt fields to strings for JSON serialization
    const orders = ordersRaw.map(order => ({
      ...order,
      uid: order.uid?.toString() ?? null,
    }))

    // Get stats
    const [totalOrders, pendingOrders, paidOrders] = await Promise.all([
      prisma.stringingOrder.count(),
      prisma.stringingOrder.count({
        where: {
          paymentStatus: { in: ['pending', 'pending_verification'] },
        },
      }),
      prisma.stringingOrder.count({
        where: {
          paymentStatus: 'paid',
        },
      }),
    ])

    return NextResponse.json({
      orders,
      stats: {
        totalOrders,
        pendingOrders,
        paidOrders,
      },
    })
  } catch (error) {
    console.error('Error fetching stringing orders:', error)
    return NextResponse.json(
      { message: 'Failed to fetch stringing orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, action } = body

    if (!orderId || !action) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'markPaid') {
      const orderRaw = await prisma.stringingOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          markedPaidBy: session.user.email,
          markedPaidAt: new Date(),
        },
      })

      // Convert BigInt to string for JSON serialization
      const order = {
        ...orderRaw,
        uid: orderRaw.uid?.toString() ?? null,
      }

      return NextResponse.json({
        success: true,
        order,
      })
    }

    if (action === 'assignJobUid') {
      const { jobUid } = body
      if (!jobUid) {
        return NextResponse.json(
          { message: 'Job UID is required' },
          { status: 400 }
        )
      }

      // Check if jobUid is already in use
      const existing = await prisma.stringingOrder.findUnique({
        where: { jobUid },
      })
      if (existing && existing.id !== orderId) {
        return NextResponse.json(
          { message: 'This Job UID is already in use' },
          { status: 400 }
        )
      }

      const orderRaw = await prisma.stringingOrder.update({
        where: { id: orderId },
        data: {
          jobUid,
          // Also set status to RECEIVED and timestamp if not already set
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      })

      const order = {
        ...orderRaw,
        uid: orderRaw.uid?.toString() ?? null,
      }

      return NextResponse.json({
        success: true,
        order,
      })
    }

    if (action === 'updateStatus') {
      const { status } = body
      const validStatuses = ['RECEIVED', 'IN_PROGRESS', 'READY', 'COLLECTED']

      if (!status || !validStatuses.includes(status)) {
        return NextResponse.json(
          { message: 'Invalid status' },
          { status: 400 }
        )
      }

      // Build update data with appropriate timestamp
      const updateData: Record<string, unknown> = { status }
      const now = new Date()

      switch (status) {
        case 'RECEIVED':
          updateData.receivedAt = now
          break
        case 'IN_PROGRESS':
          updateData.inProgressAt = now
          break
        case 'READY':
          updateData.readyAt = now
          break
        case 'COLLECTED':
          updateData.collectedAt = now
          break
      }

      const orderRaw = await prisma.stringingOrder.update({
        where: { id: orderId },
        data: updateData,
      })

      const order = {
        ...orderRaw,
        uid: orderRaw.uid?.toString() ?? null,
      }

      return NextResponse.json({
        success: true,
        order,
      })
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating stringing order:', error)
    return NextResponse.json(
      { message: 'Failed to update stringing order' },
      { status: 500 }
    )
  }
}
