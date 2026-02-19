import { AbsenceType, PlayerGroup } from "@prisma/client";

/**
 * Validates Malaysian phone number format
 * Accepts: +60123456789, 60123456789, 0123456789, 01234567890
 * @returns cleaned phone number or null if invalid
 */
export function validateMalaysianPhone(
  phone: string | undefined | null,
): string | null {
  if (!phone) return null;

  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  const mobilePattern = /^(\+?60|0)?1\d{8,9}$/;

  if (!mobilePattern.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Validates email format
 * @returns cleaned email or null if invalid
 */
export function validateEmail(email: string | undefined | null): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validates sport type
 */
export function validateSport(
  sport: string | undefined | null,
): "badminton" | "pickleball" | null {
  if (!sport) return null;

  const validSports = ["badminton", "pickleball"];
  const lower = sport.toLowerCase().trim();

  if (!validSports.includes(lower)) {
    return null;
  }

  return lower as "badminton" | "pickleball";
}

/**
 * Validates that a date is not in the past and not more than maxDays in the future
 * @param dateString - ISO date string or Date
 * @param allowToday - if true, today is valid
 * @param maxDays - maximum days in the future (default 90)
 */
export function validateFutureDate(
  dateString: string | Date | undefined | null,
  allowToday = true,
  maxDays = 90,
): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    if (allowToday) {
      if (inputDate < today) {
        return null;
      }
    } else {
      if (inputDate <= today) {
        return null;
      }
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDays);
    if (inputDate > maxDate) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Validates string tension value (18-35 lbs)
 */
export function validateTension(
  tension: number | undefined | null,
): number | null {
  if (tension === undefined || tension === null) return null;

  const num = Number(tension);

  if (isNaN(num) || num < 18 || num > 35) {
    return null;
  }

  return num;
}

/**
 * Validates payment method
 */
export function validatePaymentMethod(
  method: string | undefined | null,
): "tng" | "duitnow" | null {
  if (!method) return null;

  const validMethods = ["tng", "duitnow"];
  const lower = method.toLowerCase().trim();

  if (!validMethods.includes(lower)) {
    return null;
  }

  return lower as "tng" | "duitnow";
}

/**
 * Validates an absence type string against the AbsenceType enum.
 * @returns AbsenceType if valid, null otherwise
 */
export function validateAbsenceType(
  input: string | undefined | null,
): AbsenceType | null {
  if (!input) return null;
  const valid: string[] = Object.values(AbsenceType);
  if (!valid.includes(input)) return null;
  return input as AbsenceType;
}

/**
 * Sanitise free-text input by stripping HTML tags and trimming.
 * Prevents stored XSS when values are rendered outside React (emails, exports).
 * @returns sanitised string or null if empty
 */
export function sanitiseText(input: string | undefined | null): string | null {
  if (!input) return null;
  const cleaned = input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

/**
 * Validates a month string in YYYY-MM format
 * @returns cleaned month string or null if invalid
 */
export function validateMonth(input: string | undefined | null): string | null {
  if (!input) return null;
  const pattern = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!pattern.test(input)) return null;
  return input;
}

/**
 * Validates a team number (1 or 2 for doubles)
 * @returns 1 or 2, or null if invalid
 */
export function validateTeam(input: number | undefined | null): 1 | 2 | null {
  if (input === 1 || input === 2) return input;
  return null;
}

/**
 * Validates a player group string against the PlayerGroup enum
 * @returns PlayerGroup value or null if invalid
 */
export function validatePlayerGroup(
  input: string | undefined | null,
): PlayerGroup | null {
  if (!input) return null;
  const valid: string[] = Object.values(PlayerGroup);
  if (!valid.includes(input)) return null;
  return input as PlayerGroup;
}

/**
 * Validates a teacher name (1-100 chars, trimmed)
 * @returns trimmed name or null if invalid
 */
export function validateTeacherName(
  name: string | undefined | null,
): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return null;
  return trimmed;
}

/**
 * Validates a pay rate (positive number, max 10000)
 * @returns number or null if invalid
 */
export function validatePayRate(rate: unknown): number | null {
  if (rate === undefined || rate === null) return null;
  const num = Number(rate);
  if (isNaN(num) || num <= 0 || num > 10000) return null;
  return num;
}
