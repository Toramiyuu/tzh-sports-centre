import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// POST /api/shop/orders - create a new shop order
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      paymentMethod,
      receiptUrl,
    } = body

    // Validate required fields
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { message: 'Customer name and phone are required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'At least one item is required' },
        { status: 400 }
      )
    }

    if (!paymentMethod || !['tng', 'duitnow', 'cash'].includes(paymentMethod)) {
      return NextResponse.json(
        { message: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Validate and calculate total from items
    let total = 0
    const validatedItems = []

    for (const item of items) {
      if (!item.productId || !item.name || item.price == null || !item.quantity) {
        return NextResponse.json(
          { message: 'Each item must have productId, name, price, and quantity' },
          { status: 400 }
        )
      }

      if (item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json(
          { message: 'Item quantity must be between 1 and 99' },
          { status: 400 }
        )
      }

      total += item.price * item.quantity

      validatedItems.push({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image || null,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
      })
    }

    // Determine payment status based on method
    const paymentStatus = paymentMethod === 'cash' ? 'pending' : 'pending_verification'

    // Determine order status
    const status = paymentMethod === 'cash' ? 'PENDING_PAYMENT' : 'PENDING_PAYMENT'

    const order = await prisma.shopOrder.create({
      data: {
        userId: session?.user?.id || null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        items: validatedItems,
        total,
        status,
        paymentMethod,
        paymentStatus,
        receiptUrl: receiptUrl || null,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating shop order:', error)
    return NextResponse.json(
      { message: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET /api/shop/orders - list orders for current user (or all orders for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')
    const isAdminUser = isAdmin(session.user.email, session.user.isAdmin)

    // Admin can fetch all orders
    if (all === 'true' && isAdminUser) {
      const orders = await prisma.shopOrder.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })
      return NextResponse.json(orders)
    }

    const orders = await prisma.shopOrder.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching shop orders:', error)
    return NextResponse.json(
      { message: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
