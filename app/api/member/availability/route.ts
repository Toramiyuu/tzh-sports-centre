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
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const recurringAvailability = await prisma.coachAvailability.findMany({
      where: {
        dayOfWeek,
        isRecurring: true,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    });

    const specificAvailability = await prisma.coachAvailability.findMany({
      where: {
        isRecurring: false,
        specificDate: targetDate,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    });

    const scheduledLessons = await prisma.lessonSession.findMany({
      where: {
        lessonDate: targetDate,
        status: "scheduled",
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const availability = [...recurringAvailability, ...specificAvailability];

    return NextResponse.json({
      availability,
      scheduledLessons,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 },
    );
  }
}
