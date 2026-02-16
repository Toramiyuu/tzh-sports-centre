const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

/**
 * Check rate limit for a given key (typically IP + endpoint).
 * Returns { success, remaining, resetIn }.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs })
    return { success: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetIn: entry.resetTime - now }
  }

  entry.count++
  return { success: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetTime - now }
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

// Preset configurations
export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 },        // 5 per minute
  register: { maxRequests: 3, windowMs: 60 * 1000 },    // 3 per minute
  booking: { maxRequests: 30, windowMs: 60 * 1000 },    // 30 per minute
  api: { maxRequests: 60, windowMs: 60 * 1000 },        // 60 per minute (general)
} as const
