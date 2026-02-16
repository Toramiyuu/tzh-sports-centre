import { NextRequest, NextResponse } from 'next/server'
import { handlers } from '@/lib/auth'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export const { GET } = handlers

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  return handlers.POST(request)
}
