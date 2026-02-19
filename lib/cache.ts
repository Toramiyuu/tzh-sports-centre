import { prisma } from "@/lib/prisma";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const STATIC_TTL = 10 * 60 * 1000;

export async function getCachedTimeSlots() {
  const cached =
    getCached<Awaited<ReturnType<typeof prisma.timeSlot.findMany>>>(
      "timeSlots",
    );
  if (cached) return cached;

  const timeSlots = await prisma.timeSlot.findMany({
    orderBy: { slotTime: "asc" },
  });
  setCache("timeSlots", timeSlots, STATIC_TTL);
  return timeSlots;
}

export async function getCachedCourts() {
  const cached =
    getCached<Awaited<ReturnType<typeof prisma.court.findMany>>>("courts");
  if (cached) return cached;

  const courts = await prisma.court.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  setCache("courts", courts, STATIC_TTL);
  return courts;
}

export function invalidateCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
