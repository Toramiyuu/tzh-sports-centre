import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()

    const {
      stringId,
      stringName,
      stringColor,
      price,
      customerName,
      customerPhone,
      customerEmail,
      racketModel,
      racketModelCustom,
      tensionMain,
      tensionCross,
      pickupDate,
      notes,
      paymentMethod,
      paymentUserConfirmed,
      receiptUrl,
    } = body

    // Validation
    if (!stringId || !stringName || !price || !customerName || !customerPhone || !racketModel || !tensionMain || !tensionCross || !pickupDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate tension range
    if (tensionMain < 18 || tensionMain > 35 || tensionCross < 18 || tensionCross > 35) {
      return NextResponse.json(
        { message: 'Tension must be between 18 and 35 lbs' },
        { status: 400 }
      )
    }

    // Check stock availability
    let stock = null

    if (stringColor) {
      // Find stock by stringId and color
      stock = await prisma.stringStock.findUnique({
        where: {
          stringId_color: { stringId, color: stringColor },
        },
      })

      if (!stock) {
        return NextResponse.json(
          { message: 'This color variant is not available' },
          { status: 400 }
        )
      }

      if (stock.quantity <= 0) {
        return NextResponse.json(
          { message: 'This color is currently out of stock' },
          { status: 400 }
        )
      }
    } else {
      // No color specified - check if any color has stock
      const availableStock = await prisma.stringStock.findFirst({
        where: {
          stringId,
          quantity: { gt: 0 },
        },
      })

      if (!availableStock) {
        // Check if any stock records exist at all
        const anyStock = await prisma.stringStock.findFirst({
          where: { stringId },
        })

        if (anyStock) {
          return NextResponse.json(
            { message: 'This string is currently out of stock' },
            { status: 400 }
          )
        }
        // No stock records - allow the order (legacy behavior)
      } else {
        stock = availableStock
      }
    }

    // Create order and decrement stock atomically in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside transaction to prevent race conditions
      if (stock) {
        const currentStock = await tx.stringStock.findUnique({
          where: { id: stock.id },
        })
        if (!currentStock || currentStock.quantity <= 0) {
          throw new Error('STOCK:This string is currently out of stock')
        }
      }

      const newOrder = await tx.stringingOrder.create({
        data: {
          userId: session?.user?.id || null,
          stringName,
          stringColor: stringColor || null,
          price,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          racketModel,
          racketModelCustom: racketModelCustom || null,
          tensionMain,
          tensionCross,
          pickupDate: new Date(pickupDate),
          notes: notes || null,
          paymentMethod: paymentMethod || null,
          paymentUserConfirmed: paymentUserConfirmed || false,
          paymentStatus: paymentUserConfirmed ? 'pending_verification' : 'pending',
          paymentScreenshotUrl: receiptUrl || null,
        },
      })

      // Decrease stock and log the change if we have a stock record
      if (stock) {
        const previousQty = stock.quantity
        await tx.stringStock.update({
          where: { id: stock.id },
          data: {
            quantity: { decrement: 1 },
          },
        })

        await tx.stringStockLog.create({
          data: {
            stockId: stock.id,
            previousQty,
            newQty: previousQty - 1,
            changeType: 'order',
            orderId: newOrder.id,
            changedBy: 'system',
          },
        })
      }

      return newOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        stringName: order.stringName,
        stringColor: order.stringColor,
        price: order.price,
        customerName: order.customerName,
        pickupDate: order.pickupDate,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('STOCK:')) {
      return NextResponse.json(
        { message: error.message.replace('STOCK:', '') },
        { status: 400 }
      )
    }
    console.error('Error creating stringing order:', error)
    return NextResponse.json(
      { message: 'Failed to create stringing order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's stringing orders
    const orders = await prisma.stringingOrder.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching stringing orders:', error)
    return NextResponse.json(
      { message: 'Failed to fetch stringing orders' },
      { status: 500 }
    )
  }
}
