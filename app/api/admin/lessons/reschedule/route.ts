import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function calcEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationHours * 60;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, newCourtId, newStartTime } = body;

    if (!lessonId || !newCourtId || !newStartTime) {
      return NextResponse.json(
        { error: "lessonId, newCourtId, and newStartTime are required" },
        { status: 400 },
      );
    }

    const lesson = await prisma.lessonSession.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled lessons can be rescheduled" },
        { status: 400 },
      );
    }

    const newEndTime = calcEndTime(newStartTime, lesson.duration);
    const lessonDate = lesson.lessonDate;
    const dayOfWeek = lessonDate.getDay();

    // Check conflicts at new slot (excluding the lesson being moved)
    const bookingConflict = await prisma.booking.findFirst({
      where: {
        courtId: newCourtId,
        bookingDate: lessonDate,
        status: { in: ["pending", "confirmed"] },
        OR: [{ startTime: { lt: newEndTime }, endTime: { gt: newStartTime } }],
      },
    });

    if (bookingConflict) {
      return NextResponse.json(
        { error: "This time slot conflicts with an existing booking" },
        { status: 409 },
      );
    }

    const recurringConflict = await prisma.recurringBooking.findFirst({
      where: {
        courtId: newCourtId,
        dayOfWeek,
        isActive: true,
        startDate: { lte: lessonDate },
        OR: [{ endDate: null }, { endDate: { gte: lessonDate } }],
        startTime: { lt: newEndTime },
        endTime: { gt: newStartTime },
      },
    });

    if (recurringConflict) {
      return NextResponse.json(
        { error: "This time slot conflicts with a recurring booking" },
        { status: 409 },
      );
    }

    const lessonConflict = await prisma.lessonSession.findFirst({
      where: {
        id: { not: lessonId },
        courtId: newCourtId,
        lessonDate,
        status: { in: ["scheduled"] },
        OR: [{ startTime: { lt: newEndTime }, endTime: { gt: newStartTime } }],
      },
    });

    if (lessonConflict) {
      return NextResponse.json(
        { error: "This time slot conflicts with another lesson" },
        { status: 409 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Re-check all conflicts inside transaction
      const txBookingConflict = await tx.booking.findFirst({
        where: {
          courtId: newCourtId,
          bookingDate: lessonDate,
          status: { in: ["pending", "confirmed"] },
          OR: [
            { startTime: { lt: newEndTime }, endTime: { gt: newStartTime } },
          ],
        },
      });
      if (txBookingConflict) throw new Error("BOOKING_CONFLICT");

      const txRecurringConflict = await tx.recurringBooking.findFirst({
        where: {
          courtId: newCourtId,
          dayOfWeek,
          isActive: true,
          startDate: { lte: lessonDate },
          OR: [{ endDate: null }, { endDate: { gte: lessonDate } }],
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
        },
      });
      if (txRecurringConflict) throw new Error("BOOKING_CONFLICT");

      const txLessonConflict = await tx.lessonSession.findFirst({
        where: {
          id: { not: lessonId },
          courtId: newCourtId,
          lessonDate,
          status: { in: ["scheduled"] },
          OR: [
            { startTime: { lt: newEndTime }, endTime: { gt: newStartTime } },
          ],
        },
      });
      if (txLessonConflict) throw new Error("LESSON_CONFLICT");

      return tx.lessonSession.update({
        where: { id: lessonId },
        data: {
          courtId: newCourtId,
          startTime: newStartTime,
          endTime: newEndTime,
        },
      });
    });

    return NextResponse.json({ success: true, lesson: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "BOOKING_CONFLICT" ||
        error.message === "LESSON_CONFLICT"
      ) {
        return NextResponse.json(
          { error: "This time slot is already occupied" },
          { status: 409 },
        );
      }
    }
    console.error("Error rescheduling lesson:", error);
    return NextResponse.json(
      { error: "Failed to reschedule lesson" },
      { status: 500 },
    );
  }
}
