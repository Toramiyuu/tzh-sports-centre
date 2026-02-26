import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lessonId } = await params;

    const lesson = await prisma.lessonSession.findUnique({
      where: { id: lessonId },
      include: {
        students: { select: { id: true, name: true, phone: true } },
        attendances: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({
      lessonId: lesson.id,
      students: lesson.students,
      attendances: lesson.attendances,
    });
  } catch (error) {
    console.error("GET attendance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lessonId } = await params;
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "records must be a non-empty array of {userId, status}" },
        { status: 400 },
      );
    }

    const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
    for (const record of records) {
      if (!record.userId || !record.status) {
        return NextResponse.json(
          { error: "Each record must have userId and status" },
          { status: 400 },
        );
      }
      if (!validStatuses.includes(record.status)) {
        return NextResponse.json(
          {
            error: `Invalid status "${record.status}". Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    const lesson = await prisma.lessonSession.findUnique({
      where: { id: lessonId },
      include: { students: { select: { id: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const studentIds = new Set(lesson.students.map((s) => s.id));
    const invalidIds = records.filter(
      (r: { userId: string }) => !studentIds.has(r.userId),
    );
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: "One or more users are not enrolled in this lesson" },
        { status: 400 },
      );
    }

    const results = await prisma.$transaction(
      records.map(
        (record: { userId: string; status: string; notes?: string }) =>
          prisma.lessonAttendance.upsert({
            where: {
              lessonSessionId_userId: {
                lessonSessionId: lessonId,
                userId: record.userId,
              },
            },
            create: {
              lessonSessionId: lessonId,
              userId: record.userId,
              status: record.status as
                | "PRESENT"
                | "ABSENT"
                | "LATE"
                | "EXCUSED",
              markedBy: session.user!.id,
              notes: record.notes || null,
            },
            update: {
              status: record.status as
                | "PRESENT"
                | "ABSENT"
                | "LATE"
                | "EXCUSED",
              markedBy: session.user!.id,
              notes: record.notes || null,
            },
          }),
      ),
    );

    if (results.length === lesson.students.length) {
      await prisma.lessonSession.update({
        where: { id: lessonId },
        data: { status: "completed" },
      });
    }

    return NextResponse.json({
      recorded: results.length,
      attendances: results,
    });
  } catch (error) {
    console.error("POST attendance error:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 },
    );
  }
}
