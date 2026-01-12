import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch member's lessons
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and check if they're a member
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, isMember: true },
    })

    if (!user || !user.isMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Get member's lessons
    const lessons = await prisma.lessonSession.findMany({
      where: {
        students: {
          some: { id: user.id },
        },
      },
      include: {
        court: true,
        students: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { lessonDate: 'desc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Error fetching member lessons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }
}
