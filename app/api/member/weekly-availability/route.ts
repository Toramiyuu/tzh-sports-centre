import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isTrainee: true },
    });

    if (!user || !user.isTrainee) {
      return NextResponse.json({ error: "Not a trainee" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");

    if (!startDateStr) {
      return NextResponse.json(
        { error: "startDate is required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const courts = await prisma.court.findMany({
      select: { id: true },
    });
    const totalCourts = courts.length;

    const recurringAvailability = await prisma.coachAvailability.findMany({
      where: {
        isRecurring: true,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    });

    const specificAvailability = await prisma.coachAvailability.findMany({
      where: {
        isRecurring: false,
        isActive: true,
        specificDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: "asc" },
    });

    const scheduledLessons = await prisma.lessonSession.findMany({
      where: {
        lessonDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["scheduled", "completed"],
        },
      },
      select: {
        id: true,
        courtId: true,
        lessonDate: true,
        startTime: true,
        endTime: true,
        lessonType: true,
        status: true,
        students: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ lessonDate: "asc" }, { startTime: "asc" }],
    });

    const regularBookings = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["confirmed", "paid"],
        },
      },
      select: {
        courtId: true,
        bookingDate: true,
        startTime: true,
      },
    });

    const recurringBookings = await prisma.recurringBooking.findMany({
      where: {
        isActive: true,
      },
      select: {
        courtId: true,
        dayOfWeek: true,
        startTime: true,
      },
    });

    const pendingRequests = await prisma.lessonRequest.findMany({
      where: {
        memberId: session.user.id,
        status: "pending",
        requestedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        requestedDate: true,
        requestedTime: true,
        requestedDuration: true,
        lessonType: true,
      },
      orderBy: [{ requestedDate: "asc" }, { requestedTime: "asc" }],
    });

    const coachSuggestedRequests = await prisma.lessonRequest.findMany({
      where: {
        memberId: session.user.id,
        status: "changed",
      },
      select: {
        id: true,
        requestedDate: true,
        requestedTime: true,
        requestedDuration: true,
        lessonType: true,
        suggestedTime: true,
        adminNotes: true,
      },
    });

    const days: Record<
      string,
      {
        dayOfWeek: number;
        coachAvailability: { startTime: string; endTime: string }[];
        scheduledLessons: {
          id: string;
          startTime: string;
          endTime: string;
          lessonType: string;
          status: string;
          isMine: boolean;
        }[];
        pendingRequests: {
          id: string;
          requestedTime: string;
          requestedDuration: number;
          lessonType: string;
        }[];
        coachSuggestedRequests: {
          id: string;
          originalDate: string;
          originalTime: string;
          suggestedDate: string;
          suggestedTime: string;
          requestedDuration: number;
          lessonType: string;
          adminNotes: string | null;
        }[];
        fullyBookedSlots: string[];
      }
    > = {};

    const timeSlots: string[] = [];
    for (let hour = 9; hour <= 23; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
      timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = formatDateString(date);
      const dayOfWeek = date.getDay();

      const dayRecurring = recurringAvailability
        .filter((a) => a.dayOfWeek === dayOfWeek)
        .map((a) => ({ startTime: a.startTime, endTime: a.endTime }));

      const daySpecific = specificAvailability
        .filter((a) => {
          if (!a.specificDate) return false;
          const specificDateStr = formatDateString(new Date(a.specificDate));
          return specificDateStr === dateStr;
        })
        .map((a) => ({ startTime: a.startTime, endTime: a.endTime }));

      const coachAvailability = [...dayRecurring, ...daySpecific];

      const dayLessons = scheduledLessons
        .filter((l) => formatDateString(new Date(l.lessonDate)) === dateStr)
        .map((l) => ({
          id: l.id,
          startTime: l.startTime,
          endTime: l.endTime,
          lessonType: l.lessonType,
          status: l.status,
          isMine: l.students.some((s) => s.id === session?.user?.id),
        }));

      const dayRequests = pendingRequests
        .filter((r) => formatDateString(new Date(r.requestedDate)) === dateStr)
        .map((r) => ({
          id: r.id,
          requestedTime: r.requestedTime,
          requestedDuration: r.requestedDuration,
          lessonType: r.lessonType,
        }));

      const daySuggestions = coachSuggestedRequests
        .filter((r) => {
          if (!r.suggestedTime) return false;
          const suggestedDateStr = r.suggestedTime.split(" ")[0];
          return suggestedDateStr === dateStr;
        })
        .map((r) => {
          const [suggestedDatePart, suggestedTimePart] =
            r.suggestedTime!.split(" ");
          return {
            id: r.id,
            originalDate: formatDateString(new Date(r.requestedDate)),
            originalTime: r.requestedTime,
            suggestedDate: suggestedDatePart,
            suggestedTime: suggestedTimePart,
            requestedDuration: r.requestedDuration,
            lessonType: r.lessonType,
            adminNotes: r.adminNotes,
          };
        });

      const fullyBookedSlots: string[] = [];

      if (totalCourts > 0) {
        const dayRegularBookings = regularBookings.filter(
          (b) => formatDateString(new Date(b.bookingDate)) === dateStr,
        );

        const dayRecurringBookings = recurringBookings.filter(
          (rb) => rb.dayOfWeek === dayOfWeek,
        );

        const dayLessonBookings = scheduledLessons.filter(
          (l) => formatDateString(new Date(l.lessonDate)) === dateStr,
        );

        for (const slotTime of timeSlots) {
          let bookedCourtsCount = 0;
          const bookedCourtIds = new Set<number>();

          for (const booking of dayRegularBookings) {
            if (booking.startTime === slotTime) {
              bookedCourtIds.add(booking.courtId);
            }
          }

          for (const recurring of dayRecurringBookings) {
            if (recurring.startTime === slotTime) {
              bookedCourtIds.add(recurring.courtId);
            }
          }

          for (const lesson of dayLessonBookings) {
            if (slotTime >= lesson.startTime && slotTime < lesson.endTime) {
              bookedCourtIds.add(lesson.courtId);
            }
          }

          bookedCourtsCount = bookedCourtIds.size;

          if (bookedCourtsCount >= totalCourts) {
            fullyBookedSlots.push(slotTime);
          }
        }
      }

      days[dateStr] = {
        dayOfWeek,
        coachAvailability,
        scheduledLessons: dayLessons,
        pendingRequests: dayRequests,
        coachSuggestedRequests: daySuggestions,
        fullyBookedSlots,
      };
    }

    return NextResponse.json({
      weekStart: formatDateString(startDate),
      weekEnd: formatDateString(endDate),
      days,
    });
  } catch (error) {
    console.error("Error fetching weekly availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly availability" },
      { status: 500 },
    );
  }
}

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
