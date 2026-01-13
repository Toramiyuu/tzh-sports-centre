import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const sessions = await prisma.lessonSession.findMany({
      where: {
        students: {
          some: { id: user.id },
        },
      },
      include: {
        court: {
          select: { name: true },
        },
      },
      orderBy: { lessonDate: 'desc' },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Lessons fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}
