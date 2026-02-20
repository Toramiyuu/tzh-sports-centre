/**
 * @deprecated This module is deprecated. Use the following instead:
 * - Lesson type data: useLessonTypes() hook from '@/lib/hooks/useLessonTypes'
 * - API routes: Query prisma.lessonType directly
 * - Date utilities: Import from '@/lib/date-utils'
 */

export {
  calculateProRatedPrice,
  calculateRemainingSessions,
  getMonthlyTrainingDates,
  isValidTrainingDate,
} from "./date-utils";
