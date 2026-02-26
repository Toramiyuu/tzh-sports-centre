import { prisma } from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Kuala_Lumpur";

interface LessonBillingItem {
  lessonSessionId: string;
  lessonDate: string;
  lessonType: string;
  billingType: string;
  startTime: string;
  endTime: string;
  duration: number;
  court: string;
  pricePerStudent: number;
  amount: number;
  attended: boolean;
  totalStudents: number;
}

export interface UserLessonBilling {
  totalAmount: number;
  lessonCount: number;
  totalHours: number;
  items: LessonBillingItem[];
}

/**
 * Calculate lesson charges for a specific user from a set of lessons.
 * Pure function — no DB access.
 */
export function calculateUserLessonCharges(
  userId: string,
  lessons: Array<{
    id: string;
    lessonDate: Date;
    lessonType: string;
    billingType: string;
    startTime: string;
    endTime: string;
    duration: number;
    price: number;
    court: { name: string };
    students: Array<{ id: string }>;
    attendances: Array<{ userId: string; status: string }>;
  }>,
): UserLessonBilling {
  let totalAmount = 0;
  let totalHours = 0;
  const items: LessonBillingItem[] = [];

  for (const lesson of lessons) {
    if (!lesson.students.some((s) => s.id === userId)) continue;

    const pricePerStudent = lesson.price / lesson.students.length;
    const isPerSession = lesson.billingType !== "monthly";

    const attendance = lesson.attendances.find((a) => a.userId === userId);
    const attended =
      !attendance ||
      attendance.status === "PRESENT" ||
      attendance.status === "LATE";

    const amount = attended || !isPerSession ? pricePerStudent : 0;

    totalAmount += amount;
    totalHours += lesson.duration;

    items.push({
      lessonSessionId: lesson.id,
      lessonDate: lesson.lessonDate.toISOString().split("T")[0],
      lessonType: lesson.lessonType,
      billingType: lesson.billingType,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      duration: lesson.duration,
      court: lesson.court.name,
      pricePerStudent,
      amount,
      attended,
      totalStudents: lesson.students.length,
    });
  }

  return { totalAmount, lessonCount: items.length, totalHours, items };
}

/**
 * Query completed lessons for a month and calculate billing per user.
 * Returns a Map of userId -> UserLessonBilling.
 */
export async function getLessonBillingForMonth(
  month: number,
  year: number,
  userIds?: string[],
): Promise<Map<string, UserLessonBilling>> {
  const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE);
  const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE);

  const lessons = await prisma.lessonSession.findMany({
    where: {
      status: "completed",
      lessonDate: { gte: startDate, lt: endDate },
      ...(userIds && userIds.length > 0
        ? { students: { some: { id: { in: userIds } } } }
        : {}),
    },
    include: {
      court: true,
      students: { select: { id: true } },
      attendances: { select: { userId: true, status: true } },
    },
  });

  const studentIds = new Set<string>();
  for (const lesson of lessons) {
    for (const student of lesson.students) {
      if (!userIds || userIds.includes(student.id)) {
        studentIds.add(student.id);
      }
    }
  }

  const result = new Map<string, UserLessonBilling>();

  for (const userId of studentIds) {
    const billing = calculateUserLessonCharges(userId, lessons);
    if (billing.lessonCount > 0) {
      result.set(userId, billing);
    }
  }

  return result;
}
