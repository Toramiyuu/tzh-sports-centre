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
      where.paymentStatus = status
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
    const orders = await prisma.stringingOrder.findMany({
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
      const order = await prisma.stringingOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          markedPaidBy: session.user.email,
          markedPaidAt: new Date(),
        },
      })

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
