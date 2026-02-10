import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/shop/orders/track - look up order by ID + phone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, phone } = body

    if (!orderId || !phone) {
      return NextResponse.json(
        { found: false, message: 'Order ID and phone number are required' },
        { status: 400 }
      )
    }

    const cleanPhone = phone.replace(/\D/g, '')

    const order = await prisma.shopOrder.findFirst({
      where: {
        id: orderId.trim(),
        customerPhone: {
          contains: cleanPhone.slice(-8),
        },
      },
    })

    if (!order) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      order: {
        id: order.id,
        customerName: order.customerName,
        items: order.items,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error tracking shop order:', error)
    return NextResponse.json(
      { found: false, message: 'Failed to track order' },
      { status: 500 }
    )
  }
}
