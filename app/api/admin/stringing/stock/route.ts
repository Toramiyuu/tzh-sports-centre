import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// GET /api/admin/stringing/stock - Get all string stock with color details
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all stock records grouped by stringId
    const stockRecords = await prisma.stringStock.findMany({
      orderBy: [{ stringId: 'asc' }, { color: 'asc' }],
    })

    return NextResponse.json({ stock: stockRecords })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}

// POST /api/admin/stringing/stock - Add a new color variant for a string
export async function POST(request: NextRequest) {
  // Step 1: Auth check
  let session
  try {
    session = await auth()
  } catch (authError) {
    console.error('[Stock API] Auth error:', authError)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: Parse body
  let body
  try {
    body = await request.json()
  } catch (parseError) {
    console.error('[Stock API] Body parse error:', parseError)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { stringId, color, quantity, lowStockAlert } = body

  if (!stringId || !color) {
    return NextResponse.json(
      { error: 'String ID and color are required' },
      { status: 400 }
    )
  }

  // Normalize color (capitalize first letter)
  const normalizedColor = color.trim().charAt(0).toUpperCase() + color.trim().slice(1).toLowerCase()

  // Step 3: Check if color exists
  let existingColors
  try {
    existingColors = await prisma.stringStock.findMany({
      where: { stringId },
    })
  } catch (dbError) {
    console.error('[Stock API] DB query error:', dbError)
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  const existing = existingColors.find(
    (c: { color: string }) => c.color.toLowerCase() === normalizedColor.toLowerCase()
  )

  if (existing) {
    return NextResponse.json(
      { error: `Color "${normalizedColor}" already exists for this string` },
      { status: 400 }
    )
  }

  // Step 4: Create stock record
  let stock
  try {
    stock = await prisma.stringStock.create({
      data: {
        stringId,
        color: normalizedColor,
        quantity: quantity ?? 0,
        lowStockAlert: lowStockAlert ?? 3,
        lastUpdatedBy: session.user.email,
      },
    })
  } catch (createError) {
    console.error('[Stock API] Create error:', createError)
    return NextResponse.json({ error: 'Failed to create stock record' }, { status: 500 })
  }

  // Step 5: Create log entry
  try {
    await prisma.stringStockLog.create({
      data: {
        stockId: stock.id,
        previousQty: 0,
        newQty: quantity ?? 0,
        changeType: 'color_added',
        reason: `Added color variant: ${normalizedColor}`,
        changedBy: session.user.email,
      },
    })
  } catch (logError) {
    console.error('[Stock API] Log error:', logError)
    // Don't fail the request if logging fails
  }

  return NextResponse.json({ stock })
}
