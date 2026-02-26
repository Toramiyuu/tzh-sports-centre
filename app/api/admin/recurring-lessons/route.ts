import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const recurringLessons = await prisma.recurringLesson.findMany({
      where,
      include: {
        court: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ recurringLessons });
  } catch (error) {
    console.error("Error fetching recurring lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring lessons" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      dayOfWeek,
      startTime,
      lessonType,
      duration,
      courtId,
      studentIds,
      teacherId,
      startDate,
      endDate,
      notes,
    } = body;

    if (
      dayOfWeek === undefined ||
      !startTime ||
      !lessonType ||
      !courtId ||
      !studentIds ||
      studentIds.length === 0 ||
      !startDate
    ) {
      return NextResponse.json(
        {
          error:
            "Day of week, start time, lesson type, court, at least one student, and start date are required",
        },
        { status: 400 },
      );
    }

    const lessonTypeRecord = await prisma.lessonType.findUnique({
      where: { slug: lessonType },
      include: { pricingTiers: { orderBy: { duration: "asc" } } },
    });
    if (!lessonTypeRecord || !lessonTypeRecord.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive lesson type" },
        { status: 400 },
      );
    }

    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court || !court.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive court" },
        { status: 400 },
      );
    }

    if (studentIds.length > lessonTypeRecord.maxStudents) {
      return NextResponse.json(
        {
          error: `${lessonTypeRecord.name} allows maximum ${lessonTypeRecord.maxStudents} student(s)`,
        },
        { status: 400 },
      );
    }

    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found" },
        { status: 400 },
      );
    }

    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher || !teacher.isActive) {
        return NextResponse.json(
          { error: "Teacher not found or inactive" },
          { status: 400 },
        );
      }
    }

    const lessonDuration =
      duration || lessonTypeRecord.pricingTiers[0]?.duration || 1.5;
    const tier = lessonTypeRecord.pricingTiers.find(
      (t) => t.duration === lessonDuration,
    );
    const price = tier ? tier.price : lessonTypeRecord.price;

    const [hours, minutes] = startTime.split(":").map(Number);
    const durationMinutes = lessonDuration * 60;
    const endMinutes = minutes + durationMinutes;
    const endHours = hours + Math.floor(endMinutes / 60);
    const endTime = `${endHours.toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    const recurringLesson = await prisma.recurringLesson.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        lessonType,
        billingType: lessonTypeRecord.billingType,
        duration: lessonDuration,
        price,
        courtId,
        teacherId: teacherId || null,
        studentIds,
        isActive: true,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
      },
      include: {
        court: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ recurringLesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring lesson:", error);
    return NextResponse.json(
      { error: "Failed to create recurring lesson" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive, endDate, notes, teacherId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recurring lesson ID is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (teacherId !== undefined) updateData.teacherId = teacherId || null;

    const recurringLesson = await prisma.recurringLesson.update({
      where: { id },
      data: updateData,
      include: {
        court: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ recurringLesson });
  } catch (error) {
    console.error("Error updating recurring lesson:", error);
    return NextResponse.json(
      { error: "Failed to update recurring lesson" },
      { status: 500 },
    );
  }
}
