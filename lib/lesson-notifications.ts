import { prisma } from "@/lib/prisma";

interface LessonCreatedParams {
  studentIds: string[];
  lessonType: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  courtName: string;
}

interface LessonCancelledParams {
  studentIds: string[];
  lessonType: string;
  lessonDate: string;
  startTime: string;
  reason?: string;
}

interface LessonRescheduledParams {
  studentIds: string[];
  lessonType: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  courtName: string;
}

export async function notifyLessonCreated(params: LessonCreatedParams) {
  if (params.studentIds.length === 0) return;

  await prisma.notification.createMany({
    data: params.studentIds.map((userId) => ({
      userId,
      type: "lesson_created",
      title: "New Lesson Scheduled",
      message: `${params.lessonType} lesson on ${params.lessonDate} at ${params.startTime}-${params.endTime} (${params.courtName}).`,
      link: "/training",
    })),
  });
}

export async function notifyLessonCancelled(params: LessonCancelledParams) {
  if (params.studentIds.length === 0) return;

  const reasonText = params.reason ? ` Reason: ${params.reason}` : "";

  await prisma.notification.createMany({
    data: params.studentIds.map((userId) => ({
      userId,
      type: "lesson_cancelled",
      title: "Lesson Cancelled",
      message: `Your ${params.lessonType} lesson on ${params.lessonDate} at ${params.startTime} has been cancelled.${reasonText}`,
      link: "/training",
    })),
  });
}

export async function notifyLessonRescheduled(params: LessonRescheduledParams) {
  if (params.studentIds.length === 0) return;

  await prisma.notification.createMany({
    data: params.studentIds.map((userId) => ({
      userId,
      type: "lesson_rescheduled",
      title: "Lesson Rescheduled",
      message: `Your ${params.lessonType} lesson has been moved from ${params.oldDate} ${params.oldTime} to ${params.newDate} ${params.newTime} (${params.courtName}).`,
      link: "/training",
    })),
  });
}
