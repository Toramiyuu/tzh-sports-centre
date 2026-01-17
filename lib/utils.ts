import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a UID as a 3-digit string with leading zeros
 * e.g. 1 -> "001", 12 -> "012", 123 -> "123"
 */
export function formatUid(uid: bigint | number | string): string {
  const numericUid = typeof uid === 'bigint' ? Number(uid) : typeof uid === 'string' ? parseInt(uid, 10) : uid
  return numericUid.toString().padStart(3, '0')
}
