import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function getNextDatesForDayOfWeek(
  dayOfWeek: number,
  startDate: Date,
  endDate: Date | null,
  weeksAhead: number,
): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = startDate > today ? startDate : today;
  const current = new Date(from);

  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1);
  }

  const limitDate = new Date(today);
  limitDate.setDate(limitDate.getDate() + weeksAhead * 7);

  while (current <= limitDate) {
    if (endDate && current > endDate) break;
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const weeksAhead = Math.min(Math.max(body.weeksAhead || 4, 1), 12);

    const recurringLessons = await prisma.recurringLesson.findMany({
      where: { isActive: true },
      include: { court: { select: { name: true } } },
    });

    let generated = 0;
    let skipped = 0;
    const notificationBatch: {
      studentIds: string[];
      lessonType: string;
      lessonDate: string;
      startTime: string;
      endTime: string;
      courtName: string;
    }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const rl of recurringLessons) {
        const dates = getNextDatesForDayOfWeek(
          rl.dayOfWeek,
          rl.startDate,
          rl.endDate,
          weeksAhead,
        );

        const studentIds = rl.studentIds as string[];

        for (const date of dates) {
          const existing = await tx.lessonSession.findFirst({
            where: {
              recurringLessonId: rl.id,
              lessonDate: date,
            },
          });
          if (existing) {
            skipped++;
            continue;
          }

          const bookingConflict = await tx.booking.findFirst({
            where: {
              courtId: rl.courtId,
              bookingDate: date,
              status: { in: ["pending", "confirmed"] },
              OR: [
                {
                  startTime: { lt: rl.endTime },
                  endTime: { gt: rl.startTime },
                },
              ],
            },
          });
          if (bookingConflict) {
            skipped++;
            continue;
          }

          const lessonConflict = await tx.lessonSession.findFirst({
            where: {
              courtId: rl.courtId,
              lessonDate: date,
              status: "scheduled",
              OR: [
                {
                  startTime: { lt: rl.endTime },
                  endTime: { gt: rl.startTime },
                },
              ],
            },
          });
          if (lessonConflict) {
            skipped++;
            continue;
          }

          await tx.lessonSession.create({
            data: {
              courtId: rl.courtId,
              teacherId: rl.teacherId,
              lessonDate: date,
              startTime: rl.startTime,
              endTime: rl.endTime,
              lessonType: rl.lessonType,
              billingType: rl.billingType,
              duration: rl.duration,
              price: rl.price,
              status: "scheduled",
              recurringLessonId: rl.id,
              notes: rl.notes,
              students: {
                connect: studentIds.map((id) => ({ id })),
              },
            },
          });
          notificationBatch.push({
            studentIds,
            lessonType: rl.lessonType,
            lessonDate: format(date, "MMM d"),
            startTime: rl.startTime,
            endTime: rl.endTime,
            courtName: rl.court.name,
          });
          generated++;
        }
      }
    });

    if (notificationBatch.length > 0) {
      const { notifyLessonCreated } =
        await import("@/lib/lesson-notifications");
      for (const n of notificationBatch) {
        await notifyLessonCreated(n).catch((err) =>
          console.error("Notification error:", err),
        );
      }
    }

    return NextResponse.json({ generated, skipped });
  } catch (error) {
    console.error("Error generating recurring lessons:", error);
    return NextResponse.json(
      { error: "Failed to generate lessons" },
      { status: 500 },
    );
  }
}
