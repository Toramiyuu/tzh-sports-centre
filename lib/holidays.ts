// Malaysian Public Holidays 2026
// Update this file yearly with new dates

export const MALAYSIAN_HOLIDAYS_2026: { date: string; name: string }[] = [
  // Fixed holidays
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-02-01', name: 'Federal Territory Day' },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-06-01', name: "Yang di-Pertuan Agong's Birthday" },
  { date: '2026-08-31', name: 'Merdeka Day' },
  { date: '2026-09-16', name: 'Malaysia Day' },
  { date: '2026-12-25', name: 'Christmas Day' },

  // Variable holidays (Islamic calendar - dates approximate for 2026)
  { date: '2026-01-27', name: 'Thaipusam' },
  { date: '2026-02-17', name: 'Chinese New Year' },
  { date: '2026-02-18', name: 'Chinese New Year (Day 2)' },
  { date: '2026-03-20', name: 'Hari Raya Aidilfitri' },
  { date: '2026-03-21', name: 'Hari Raya Aidilfitri (Day 2)' },
  { date: '2026-05-12', name: 'Wesak Day' },
  { date: '2026-05-27', name: 'Hari Raya Haji' },
  { date: '2026-06-16', name: 'Awal Muharram' },
  { date: '2026-08-25', name: "Prophet Muhammad's Birthday" },
  { date: '2026-11-01', name: 'Deepavali' },

  // Penang-specific holidays (since TZH is in Penang)
  { date: '2026-07-07', name: 'George Town Heritage Day' },
]

// Malaysian School Holidays 2026 (approximate - check MOE for exact dates)
export const SCHOOL_HOLIDAYS_2026: { start: string; end: string; name: string }[] = [
  { start: '2026-03-14', end: '2026-03-22', name: 'Mid-Term Break 1' },
  { start: '2026-05-23', end: '2026-06-07', name: 'Mid-Year Holiday' },
  { start: '2026-08-15', end: '2026-08-23', name: 'Mid-Term Break 2' },
  { start: '2026-11-21', end: '2026-12-31', name: 'Year-End Holiday' },
]

/**
 * Check if a date is a Malaysian public holiday
 */
export function isPublicHoliday(date: Date): boolean {
  const dateStr = formatDateToString(date)
  return MALAYSIAN_HOLIDAYS_2026.some(h => h.date === dateStr)
}

/**
 * Get holiday name for a date (if it's a holiday)
 */
export function getHolidayName(date: Date): string | null {
  const dateStr = formatDateToString(date)
  const holiday = MALAYSIAN_HOLIDAYS_2026.find(h => h.date === dateStr)
  return holiday?.name || null
}

/**
 * Check if a date is during school holidays
 */
export function isSchoolHoliday(date: Date): boolean {
  const dateStr = formatDateToString(date)
  return SCHOOL_HOLIDAYS_2026.some(
    h => dateStr >= h.start && dateStr <= h.end
  )
}

/**
 * Check if a date should use weekend hours (Saturday, Sunday, or Public Holiday)
 */
export function shouldUseWeekendHours(date: Date): boolean {
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  return isWeekend || isPublicHoliday(date)
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
