// Centralized lesson configuration
// Edit prices and rules here - they will apply across the entire app

export type BillingType = 'per_session' | 'monthly'

export interface LessonTypeConfig {
  value: string
  label: string
  billingType: BillingType
  allowedDurations: number[] // in hours, empty for monthly (admin assigns)
  pricing: Record<number, number> | number // duration -> price for per_session, flat price for monthly
  pricePerPerson?: Record<number, number> | number // per-person price for group lessons
  maxStudents: number
  sessionsPerMonth?: number // only for monthly billing
  description?: string
  detailedDescription?: string // Full description for details modal
  benefits?: string[] // List of benefits/features
}

// Lesson types with pricing (edit prices here)
export const LESSON_TYPES: LessonTypeConfig[] = [
  {
    value: '1-to-1',
    label: '1-to-1 Private',
    billingType: 'per_session',
    allowedDurations: [1.5, 2],
    pricing: {
      1.5: 130,
      2: 160,
    },
    maxStudents: 1,
    description: 'Private one-on-one coaching',
    detailedDescription: 'Get undivided attention from our coach with personalized training tailored to your skill level and goals. Perfect for players who want to improve quickly.',
    benefits: [
      'Personalized coaching',
      'Focused skill improvement',
      'Best for fast progress',
    ],
  },
  {
    value: '1-to-2',
    label: '1-to-2',
    billingType: 'per_session',
    allowedDurations: [1.5, 2],
    pricing: {
      1.5: 160,
      2: 180,
    },
    pricePerPerson: {
      1.5: 80,
      2: 90,
    },
    maxStudents: 2,
    description: 'Semi-private lesson for 2 students',
    detailedDescription: 'Train with a friend or family member in this semi-private format. Enjoy more personal attention while practicing competitive drills together.',
    benefits: [
      'Train with a friend',
      'More personal attention',
      'Competitive drills',
    ],
  },
  {
    value: '1-to-3',
    label: '1-to-3',
    billingType: 'per_session',
    allowedDurations: [2], // Only 2 hours allowed
    pricing: {
      2: 180,
    },
    pricePerPerson: {
      2: 60,
    },
    maxStudents: 3,
    description: 'Small group lesson for 3 students (2 hours only)',
    detailedDescription: 'Small group training with match-style drills. A great balance between individual attention and group dynamics.',
    benefits: [
      'Small group training',
      'More match-style drills',
      'Good balance of cost and attention',
    ],
  },
  {
    value: '1-to-4',
    label: '1-to-4',
    billingType: 'per_session',
    allowedDurations: [2], // Only 2 hours allowed
    pricing: {
      2: 200,
    },
    pricePerPerson: {
      2: 50,
    },
    maxStudents: 4,
    description: 'Small group lesson for 4 students (2 hours only)',
    detailedDescription: 'Team-style training in a fun, social environment. Best value per person while still getting quality coaching.',
    benefits: [
      'Team-style training',
      'Fun and social',
      'Best value per person',
    ],
  },
  {
    value: 'small-kids-beginners',
    label: 'Small Group Kids (Beginners)',
    billingType: 'monthly',
    allowedDurations: [], // Admin assigns schedule
    pricing: 50, // RM50 per month
    maxStudents: 6,
    sessionsPerMonth: 4,
    description: 'Monthly kids beginner group - 4 sessions/month',
    detailedDescription: 'Introduction to badminton for young beginners. Fun-based learning approach that builds fundamental skills and love for the sport.',
    benefits: [
      'Beginner friendly',
      'Fun-based learning',
      'Builds fundamentals',
    ],
  },
  {
    value: 'large-kids',
    label: 'Large Group Kids',
    billingType: 'monthly',
    allowedDurations: [], // Admin assigns schedule
    pricing: 100, // RM100 per month
    maxStudents: 12,
    sessionsPerMonth: 4,
    description: 'Monthly kids group - 4 sessions/month',
    detailedDescription: 'Group training for kids focusing on drills, fitness, and coordination. Great for developing teamwork and social skills.',
    benefits: [
      'Group drills',
      'Fitness and coordination',
      'Social skill development',
    ],
  },
  {
    value: 'large-kids-intermediate',
    label: 'Large Group Kids (Intermediate)',
    billingType: 'monthly',
    allowedDurations: [], // Admin assigns schedule
    pricing: 140, // RM140 per month
    maxStudents: 12,
    sessionsPerMonth: 4,
    description: 'Monthly intermediate kids group - 4 sessions/month',
    detailedDescription: 'Higher intensity training for intermediate players. Focus on match tactics, competitive play, and advanced techniques.',
    benefits: [
      'Higher intensity',
      'Match tactics',
      'Competitive training',
    ],
  },
  {
    value: 'small-adult-group',
    label: 'Small Adult Group',
    billingType: 'per_session',
    allowedDurations: [2], // Only 2 hours allowed
    pricing: {
      2: 50,
    },
    maxStudents: 6,
    description: 'Adult group lesson (2 hours only)',
    detailedDescription: 'Social training for adults focusing on fitness, technique refinement, and enjoying the game with others.',
    benefits: [
      'Social training',
      'Fitness focused',
      'Skill refinement',
    ],
  },
]

// Helper functions
export function getLessonType(value: string): LessonTypeConfig | undefined {
  return LESSON_TYPES.find(t => t.value === value)
}

export function getLessonPrice(lessonType: string, duration?: number): number {
  const type = getLessonType(lessonType)
  if (!type) return 0

  if (type.billingType === 'monthly') {
    return type.pricing as number
  }

  const prices = type.pricing as Record<number, number>
  if (duration && prices[duration]) {
    return prices[duration]
  }

  // Return minimum (cheapest) price if duration not specified
  const priceValues = Object.values(prices)
  return priceValues.length > 0 ? Math.min(...priceValues) : 0
}

export function getDefaultDuration(lessonType: string): number {
  const type = getLessonType(lessonType)
  if (!type || type.allowedDurations.length === 0) return 2 // Default to 2 hours
  return type.allowedDurations[0]
}

export function isMonthlyBilling(lessonType: string): boolean {
  const type = getLessonType(lessonType)
  return type?.billingType === 'monthly'
}

export function getDurationOptions(lessonType: string): { value: number; label: string; price: number; pricePerPerson?: number }[] {
  const type = getLessonType(lessonType)
  if (!type || type.billingType === 'monthly') return []

  const prices = type.pricing as Record<number, number>
  const perPersonPrices = type.pricePerPerson as Record<number, number> | undefined
  return type.allowedDurations.map(duration => ({
    value: duration,
    label: `${duration} hours`,
    price: prices[duration] || 0,
    pricePerPerson: perPersonPrices?.[duration],
  }))
}

// Get per-person price for group lessons
export function getPricePerPerson(lessonType: string, duration?: number): number | null {
  const type = getLessonType(lessonType)
  if (!type || !type.pricePerPerson) return null

  if (type.billingType === 'monthly') {
    return type.pricePerPerson as number
  }

  const prices = type.pricePerPerson as Record<number, number>
  if (duration && prices[duration]) {
    return prices[duration]
  }

  // Return minimum (cheapest) per-person price if duration not specified
  const priceValues = Object.values(prices)
  return priceValues.length > 0 ? Math.min(...priceValues) : null
}

// Check if lesson type has per-person pricing
export function hasPerPersonPricing(lessonType: string): boolean {
  const type = getLessonType(lessonType)
  return !!type?.pricePerPerson
}

// Calculate pro-rated price for monthly billing
// Based on remaining sessions in the month
export function calculateProRatedPrice(
  lessonType: string,
  remainingSessions: number
): number {
  const type = getLessonType(lessonType)
  if (!type || type.billingType !== 'monthly') return 0

  const monthlyPrice = type.pricing as number
  const totalSessions = type.sessionsPerMonth || 4
  const pricePerSession = monthlyPrice / totalSessions

  return Math.round(pricePerSession * remainingSessions)
}

// Calculate how many sessions remain in a month for a given weekday
// Skips the 5th occurrence automatically
export function calculateRemainingSessions(
  weekday: number, // 0 = Sunday, 1 = Monday, etc.
  fromDate: Date
): number {
  const year = fromDate.getFullYear()
  const month = fromDate.getMonth()
  const currentDay = fromDate.getDate()

  // Find all occurrences of the weekday in this month
  const occurrences: number[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    if (date.getDay() === weekday) {
      occurrences.push(day)
    }
  }

  // Only count first 4 occurrences (skip 5th)
  const validOccurrences = occurrences.slice(0, 4)

  // Count remaining sessions from the current date
  return validOccurrences.filter(day => day >= currentDay).length
}

// Get the valid training dates for a month (first 4 occurrences of a weekday)
export function getMonthlyTrainingDates(
  weekday: number,
  year: number,
  month: number // 0-indexed
): Date[] {
  const dates: Date[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    if (date.getDay() === weekday) {
      dates.push(date)
    }
  }

  // Return only first 4 occurrences
  return dates.slice(0, 4)
}

// Check if a date is a valid training date (not the 5th occurrence)
export function isValidTrainingDate(date: Date): boolean {
  const weekday = date.getDay()
  const validDates = getMonthlyTrainingDates(
    weekday,
    date.getFullYear(),
    date.getMonth()
  )

  return validDates.some(
    d => d.getDate() === date.getDate()
  )
}
