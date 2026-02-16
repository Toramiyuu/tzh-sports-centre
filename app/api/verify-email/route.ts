import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: { gte: new Date() },
        pendingEmail: { not: null },
      },
    })

    if (!user) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        `${appUrl}/profile?verify=expired`
      )
    }

    // Check the pending email isn't already taken by another user
    const emailTaken = await prisma.user.findUnique({
      where: { email: user.pendingEmail! },
    })

    if (emailTaken && emailTaken.id !== user.id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        `${appUrl}/profile?verify=taken`
      )
    }

    // Apply the email change
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail!,
        pendingEmail: null,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${appUrl}/profile?verify=success`
    )
  } catch (error) {
    console.error('Email verification error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${appUrl}/profile?verify=error`
    )
  }
}
