import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

// GET /api/admin/stringing/stock/logs - Get all stock logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stringId = searchParams.get('stringId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const logs = await prisma.stringStockLog.findMany({
      where: stringId
        ? { stock: { stringId } }
        : undefined,
      include: {
        stock: {
          select: { stringId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching stock logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock logs' },
      { status: 500 }
    )
  }
}
