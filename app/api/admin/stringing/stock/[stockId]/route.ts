import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// PATCH /api/admin/stringing/stock/[stockId] - Update stock quantity or settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stockId } = await params
    const body = await request.json()
    const { quantity, lowStockAlert, reason } = body

    // Find stock record
    const stock = await prisma.stringStock.findUnique({
      where: { id: stockId },
    })

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    const previousQty = stock.quantity

    // Update stock
    const updatedStock = await prisma.stringStock.update({
      where: { id: stockId },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(lowStockAlert !== undefined && { lowStockAlert }),
        lastUpdatedBy: session.user.email,
      },
    })

    // Log the change if quantity changed
    if (quantity !== undefined && quantity !== previousQty) {
      await prisma.stringStockLog.create({
        data: {
          stockId: stock.id,
          previousQty,
          newQty: quantity,
          changeType: quantity > previousQty ? 'restock' : 'manual_adjust',
          reason: reason || null,
          changedBy: session.user.email,
        },
      })
    }

    return NextResponse.json({ stock: updatedStock })
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/stringing/stock/[stockId] - Delete a color variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stockId } = await params

    // Find stock record
    const stock = await prisma.stringStock.findUnique({
      where: { id: stockId },
    })

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    // Delete the stock record (logs will be cascade deleted)
    await prisma.stringStock.delete({
      where: { id: stockId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stock:', error)
    return NextResponse.json(
      { error: 'Failed to delete stock' },
      { status: 500 }
    )
  }
}

// GET /api/admin/stringing/stock/[stockId] - Get stock details with recent logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stockId } = await params

    const stock = await prisma.stringStock.findUnique({
      where: { id: stockId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json({ stock })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}
