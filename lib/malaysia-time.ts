/**
 * Malaysian Time Utilities
 * Malaysia is in UTC+8 timezone (Asia/Kuala_Lumpur)
 */

const MALAYSIA_TIMEZONE = 'Asia/Kuala_Lumpur'

/**
 * Get current date and time in Malaysia timezone
 */
export function getMalaysiaTime(): Date {
  // Create a date string in Malaysia timezone and parse it back
  const now = new Date()
  const malaysiaTimeStr = now.toLocaleString('en-US', { timeZone: MALAYSIA_TIMEZONE })
  return new Date(malaysiaTimeStr)
}

/**
 * Get current time in HH:mm format (24-hour) in Malaysia timezone
 * e.g., "15:30" for 3:30 PM
 */
export function getMalaysiaTimeString(): string {
  const malaysiaTime = getMalaysiaTime()
  const hours = malaysiaTime.getHours().toString().padStart(2, '0')
  const minutes = malaysiaTime.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Get current date in YYYY-MM-DD format in Malaysia timezone
 */
export function getMalaysiaDateString(): string {
  const malaysiaTime = getMalaysiaTime()
  const year = malaysiaTime.getFullYear()
  const month = (malaysiaTime.getMonth() + 1).toString().padStart(2, '0')
  const day = malaysiaTime.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a given date string (YYYY-MM-DD) is today in Malaysia timezone
 */
export function isTodayInMalaysia(dateString: string): boolean {
  return dateString === getMalaysiaDateString()
}

/**
 * Check if a time slot (HH:mm format) has passed based on current Malaysia time
 * A slot is considered "past" if the current time is past the slot start time
 *
 * @param slotTime - Time in HH:mm format (e.g., "15:00")
 * @returns true if the slot time has passed
 */
export function isSlotTimePast(slotTime: string): boolean {
  const currentTime = getMalaysiaTimeString()
  // Simple string comparison works because both are in HH:mm 24-hour format
  return currentTime > slotTime
}

/**
 * Check if a slot is past for a given date
 * Returns true only if the date is today AND the time has passed
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param slotTime - Time in HH:mm format (e.g., "15:00")
 * @returns true if the slot is in the past
 */
export function isSlotPast(dateString: string, slotTime: string): boolean {
  if (!isTodayInMalaysia(dateString)) {
    return false // Future dates are never past
  }
  return isSlotTimePast(slotTime)
}
