import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function calcEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
}

function durationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, newCourtId, newStartTime } = body;

    if (!bookingId || !newCourtId || !newStartTime) {
      return NextResponse.json(
        {
          error: "bookingId, newCourtId, and newStartTime are required",
        },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot reschedule a cancelled booking" },
        { status: 400 },
      );
    }

    const bookingDate = booking.bookingDate;
    const dur = durationMinutes(booking.startTime, booking.endTime);
    const newEndTime = calcEndTime(newStartTime, dur);

    // Check conflicts at new slot (excluding the booking being moved)
    const bookingConflict = await prisma.booking.findFirst({
      where: {
        id: { not: bookingId },
        courtId: newCourtId,
        bookingDate,
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

    const dayOfWeek = bookingDate.getDay();
    const recurringConflict = await prisma.recurringBooking.findFirst({
      where: {
        courtId: newCourtId,
        dayOfWeek,
        isActive: true,
        startDate: { lte: bookingDate },
        OR: [{ endDate: null }, { endDate: { gte: bookingDate } }],
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
        courtId: newCourtId,
        lessonDate: bookingDate,
        status: { in: ["scheduled"] },
        OR: [{ startTime: { lt: newEndTime }, endTime: { gt: newStartTime } }],
      },
    });

    if (lessonConflict) {
      return NextResponse.json(
        { error: "This time slot conflicts with a lesson" },
        { status: 409 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Re-check all conflicts inside transaction
      const txConflict = await tx.booking.findFirst({
        where: {
          id: { not: bookingId },
          courtId: newCourtId,
          bookingDate,
          status: { in: ["pending", "confirmed"] },
          OR: [
            { startTime: { lt: newEndTime }, endTime: { gt: newStartTime } },
          ],
        },
      });
      if (txConflict) throw new Error("BOOKING_CONFLICT");

      const txRecurringConflict = await tx.recurringBooking.findFirst({
        where: {
          courtId: newCourtId,
          dayOfWeek,
          isActive: true,
          startDate: { lte: bookingDate },
          OR: [{ endDate: null }, { endDate: { gte: bookingDate } }],
          startTime: { lt: newEndTime },
          endTime: { gt: newStartTime },
        },
      });
      if (txRecurringConflict) throw new Error("BOOKING_CONFLICT");

      const txLessonConflict = await tx.lessonSession.findFirst({
        where: {
          courtId: newCourtId,
          lessonDate: bookingDate,
          status: { in: ["scheduled"] },
          OR: [
            { startTime: { lt: newEndTime }, endTime: { gt: newStartTime } },
          ],
        },
      });
      if (txLessonConflict) throw new Error("BOOKING_CONFLICT");

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          courtId: newCourtId,
          startTime: newStartTime,
          endTime: newEndTime,
        },
      });
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_CONFLICT") {
      return NextResponse.json(
        { error: "This time slot conflicts with an existing booking" },
        { status: 409 },
      );
    }
    console.error("Error rescheduling booking:", error);
    return NextResponse.json(
      { error: "Failed to reschedule booking" },
      { status: 500 },
    );
  }
}
