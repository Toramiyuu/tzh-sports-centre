import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateMalaysianPhone, validateEmail, validateTension, validateFutureDate } from '@/lib/validation'
import { STRING_INVENTORY } from '@/lib/stringing-config'

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

    // Validation - required fields
    if (!stringId || !stringName || !price || !customerName || !customerPhone || !racketModel || !tensionMain || !tensionCross || !pickupDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate string ID exists in config
    const validString = STRING_INVENTORY.find(s => s.id === stringId)
    if (!validString) {
      return NextResponse.json(
        { message: 'Invalid string selection' },
        { status: 400 }
      )
    }

    // Validate phone number format
    const validatedPhone = validateMalaysianPhone(customerPhone)
    if (!validatedPhone) {
      return NextResponse.json(
        { message: 'Invalid phone number format. Please use a valid Malaysian phone number.' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    let validatedEmail: string | null = null
    if (customerEmail) {
      validatedEmail = validateEmail(customerEmail)
      if (!validatedEmail) {
        return NextResponse.json(
          { message: 'Invalid email address format' },
          { status: 400 }
        )
      }
    }

    // Validate tension range (server-side enforcement)
    const validatedTensionMain = validateTension(tensionMain)
    const validatedTensionCross = validateTension(tensionCross)
    if (!validatedTensionMain || !validatedTensionCross) {
      return NextResponse.json(
        { message: 'Tension must be between 18 and 35 lbs' },
        { status: 400 }
      )
    }

    // Validate pickup date is not in the past
    const validatedPickupDate = validateFutureDate(pickupDate)
    if (!validatedPickupDate) {
      return NextResponse.json(
        { message: 'Pickup date cannot be in the past' },
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

    // Atomically decrement stock first (if applicable), then create order
    // Uses raw SQL for atomic decrement - avoids interactive transactions (Neon pooler)
    let decrementedFromQty: number | null = null

    if (stock) {
      // Atomic decrement: only succeeds if quantity > 0
      const decrementResult = await prisma.$queryRaw<{ quantity: number }[]>`
        UPDATE string_stock
        SET quantity = quantity - 1
        WHERE id = ${stock.id} AND quantity > 0
        RETURNING quantity
      `

      if (!decrementResult || decrementResult.length === 0) {
        return NextResponse.json(
          { message: 'This string is currently out of stock' },
          { status: 400 }
        )
      }

      decrementedFromQty = stock.quantity // Previous quantity before decrement
    }

    // Create the order
    const order = await prisma.stringingOrder.create({
      data: {
        userId: session?.user?.id || null,
        stringName,
        stringColor: stringColor || null,
        price,
        customerName,
        customerPhone: validatedPhone,
        customerEmail: validatedEmail,
        racketModel,
        racketModelCustom: racketModelCustom || null,
        tensionMain: validatedTensionMain,
        tensionCross: validatedTensionCross,
        pickupDate: validatedPickupDate,
        notes: notes || null,
        paymentMethod: paymentMethod || null,
        paymentUserConfirmed: paymentUserConfirmed || false,
        paymentStatus: paymentUserConfirmed ? 'pending_verification' : 'pending',
        paymentScreenshotUrl: receiptUrl || null,
      },
    })

    // Log the stock change if we decremented
    if (stock && decrementedFromQty !== null) {
      await prisma.stringStockLog.create({
        data: {
          stockId: stock.id,
          previousQty: decrementedFromQty,
          newQty: decrementedFromQty - 1,
          changeType: 'order',
          orderId: order.id,
          changedBy: 'system',
        },
      })
    }

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
