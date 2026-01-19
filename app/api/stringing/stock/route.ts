import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STRING_INVENTORY } from '@/lib/stringing-config'

// GET /api/stringing/stock - Get stock status for all strings (public)
// Returns available colors for each string and overall in-stock status
export async function GET() {
  try {
    // Get all stock records with colors
    const stockRecords = await prisma.stringStock.findMany({
      select: {
        stringId: true,
        color: true,
        quantity: true,
      },
      orderBy: [{ stringId: 'asc' }, { color: 'asc' }],
    })

    // Group by stringId
    const stockByString = new Map<string, { color: string; inStock: boolean }[]>()
    for (const record of stockRecords) {
      const colors = stockByString.get(record.stringId) || []
      colors.push({
        color: record.color,
        inStock: record.quantity > 0,
      })
      stockByString.set(record.stringId, colors)
    }

    // Build response with all strings
    const stockStatus: Record<string, {
      inStock: boolean
      colors: { color: string; inStock: boolean }[]
    }> = {}

    for (const string of STRING_INVENTORY) {
      const colors = stockByString.get(string.id) || []
      // String is in stock if it has at least one color with stock > 0
      const hasStock = colors.some((c) => c.inStock)
      // Only return colors that are in stock for selection
      const availableColors = colors.filter((c) => c.inStock)

      stockStatus[string.id] = {
        inStock: hasStock,
        colors: availableColors,
      }
    }

    return NextResponse.json({ stockStatus })
  } catch (error) {
    console.error('Error fetching stock status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock status' },
      { status: 500 }
    )
  }
}
