// Shared validation utilities for API routes

/**
 * Validates Malaysian phone number format
 * Accepts: +60123456789, 60123456789, 0123456789, 01234567890
 * @returns cleaned phone number or null if invalid
 */
export function validateMalaysianPhone(phone: string | undefined | null): string | null {
  if (!phone) return null

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // Pattern: optional +, optional 60, then 1 followed by 0-9 digits (9-10 more digits)
  // Valid formats: +60123456789, 60123456789, 0123456789, 01234567890
  const mobilePattern = /^(\+?60|0)?1\d{8,9}$/

  if (!mobilePattern.test(cleaned)) {
    return null
  }

  return cleaned
}

/**
 * Validates email format
 * @returns cleaned email or null if invalid
 */
export function validateEmail(email: string | undefined | null): string | null {
  if (!email) return null

  const trimmed = email.trim().toLowerCase()

  // Basic but reasonable email regex
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  if (!emailPattern.test(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Validates sport type
 */
export function validateSport(sport: string | undefined | null): 'badminton' | 'pickleball' | null {
  if (!sport) return null

  const validSports = ['badminton', 'pickleball']
  const lower = sport.toLowerCase().trim()

  if (!validSports.includes(lower)) {
    return null
  }

  return lower as 'badminton' | 'pickleball'
}

/**
 * Validates that a date is not in the past and not more than maxDays in the future
 * @param dateString - ISO date string or Date
 * @param allowToday - if true, today is valid
 * @param maxDays - maximum days in the future (default 90)
 */
export function validateFutureDate(dateString: string | Date | undefined | null, allowToday = true, maxDays = 90): Date | null {
  if (!dateString) return null

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return null
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const inputDate = new Date(date)
    inputDate.setHours(0, 0, 0, 0)

    if (allowToday) {
      if (inputDate < today) {
        return null
      }
    } else {
      if (inputDate <= today) {
        return null
      }
    }

    // Check maximum future date
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + maxDays)
    if (inputDate > maxDate) {
      return null
    }

    return date
  } catch {
    return null
  }
}

/**
 * Validates string tension value (18-35 lbs)
 */
export function validateTension(tension: number | undefined | null): number | null {
  if (tension === undefined || tension === null) return null

  const num = Number(tension)

  if (isNaN(num) || num < 18 || num > 35) {
    return null
  }

  return num
}

/**
 * Validates payment method
 */
export function validatePaymentMethod(method: string | undefined | null): 'tng' | 'duitnow' | null {
  if (!method) return null

  const validMethods = ['tng', 'duitnow']
  const lower = method.toLowerCase().trim()

  if (!validMethods.includes(lower)) {
    return null
  }

  return lower as 'tng' | 'duitnow'
}

/**
 * Sanitise free-text input by stripping HTML tags and trimming.
 * Prevents stored XSS when values are rendered outside React (emails, exports).
 * @returns sanitised string or null if empty
 */
export function sanitiseText(input: string | undefined | null): string | null {
  if (!input) return null
  // Strip HTML tags, then collapse whitespace and trim
  const cleaned = input
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || null
}
