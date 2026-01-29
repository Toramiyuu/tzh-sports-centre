import { prisma } from '@/lib/prisma'

// Simple in-memory cache for data that rarely changes
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

// Cache TTL: 10 minutes for static data
const STATIC_TTL = 10 * 60 * 1000

// Cached time slots - these almost never change
export async function getCachedTimeSlots() {
  const cached = getCached<Awaited<ReturnType<typeof prisma.timeSlot.findMany>>>('timeSlots')
  if (cached) return cached

  const timeSlots = await prisma.timeSlot.findMany({
    orderBy: { slotTime: 'asc' },
  })
  setCache('timeSlots', timeSlots, STATIC_TTL)
  return timeSlots
}

// Cached courts - these rarely change
export async function getCachedCourts() {
  const cached = getCached<Awaited<ReturnType<typeof prisma.court.findMany>>>('courts')
  if (cached) return cached

  const courts = await prisma.court.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  })
  setCache('courts', courts, STATIC_TTL)
  return courts
}

// Invalidate cache when courts or time slots are modified
export function invalidateCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
