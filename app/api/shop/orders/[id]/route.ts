import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// GET /api/shop/orders/[id] - fetch a single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    const order = await prisma.shopOrder.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check access: order owner or admin
    const isOwner = session?.user?.id && order.userId === session.user.id
    const isAdminUser = session?.user && isAdmin(session.user.email, session.user.isAdmin)

    if (!isOwner && !isAdminUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching shop order:', error)
    return NextResponse.json(
      { message: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/shop/orders/[id] - update order status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, paymentStatus } = body

    const validStatuses = [
      'PENDING_PAYMENT',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'COMPLETED',
      'CANCELLED',
    ]

    const updateData: Record<string, string> = {}

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { message: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'pending_verification', 'verified', 'paid']
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { message: 'Invalid payment status' },
          { status: 400 }
        )
      }
      updateData.paymentStatus = paymentStatus
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const order = await prisma.shopOrder.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating shop order:', error)
    return NextResponse.json(
      { message: 'Failed to update order' },
      { status: 500 }
    )
  }
}
