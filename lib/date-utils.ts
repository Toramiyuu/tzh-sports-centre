/**
 * Date utility functions for monthly lesson scheduling.
 * Moved from lib/lesson-config.ts during database-driven lesson types migration.
 */

/**
 * Calculate pro-rated price for monthly billing based on remaining sessions.
 */
export function calculateProRatedPrice(
  monthlyPrice: number,
  totalSessions: number,
  remainingSessions: number,
): number {
  const pricePerSession = monthlyPrice / totalSessions;
  return Math.round(pricePerSession * remainingSessions);
}

/**
 * Calculate how many sessions remain in a month for a given weekday.
 * Skips the 5th occurrence automatically (only counts first 4).
 */
export function calculateRemainingSessions(
  weekday: number,
  fromDate: Date,
): number {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const currentDay = fromDate.getDate();

  const occurrences: number[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === weekday) {
      occurrences.push(day);
    }
  }

  const validOccurrences = occurrences.slice(0, 4);
  return validOccurrences.filter((day) => day >= currentDay).length;
}

/**
 * Get the valid training dates for a month (first 4 occurrences of a weekday).
 */
export function getMonthlyTrainingDates(
  weekday: number,
  year: number,
  month: number,
): Date[] {
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === weekday) {
      dates.push(date);
    }
  }

  return dates.slice(0, 4);
}

/**
 * Check if a date is a valid training date (not the 5th occurrence of its weekday).
 */
export function isValidTrainingDate(date: Date): boolean {
  const weekday = date.getDay();
  const validDates = getMonthlyTrainingDates(
    weekday,
    date.getFullYear(),
    date.getMonth(),
  );

  return validDates.some((d) => d.getDate() === date.getDate());
}
