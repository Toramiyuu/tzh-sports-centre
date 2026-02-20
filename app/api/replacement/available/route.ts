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
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const lessonType = searchParams.get("lessonType");

    const where: Record<string, unknown> = {
      status: "scheduled",
      lessonDate: { gt: new Date() },
      students: { none: { id: user.id } },
      replacementBookings: {
        none: { userId: user.id, status: "CONFIRMED" },
      },
    };

    if (lessonType) {
      where.lessonType = lessonType;
    }

    const [lessonSessions, allLessonTypes] = await Promise.all([
      prisma.lessonSession.findMany({
        where,
        include: {
          court: { select: { name: true } },
          students: { select: { id: true } },
          replacementBookings: {
            where: { status: "CONFIRMED" },
            select: { id: true },
          },
        },
        orderBy: { lessonDate: "asc" },
        take: 20,
      }),
      prisma.lessonType.findMany({
        where: { isActive: true },
        select: { slug: true, maxStudents: true },
      }),
    ]);

    const lessonTypeMap = new Map(allLessonTypes.map((lt) => [lt.slug, lt]));

    const sessions = lessonSessions
      .map((s) => {
        const config = lessonTypeMap.get(s.lessonType);
        const maxStudents = config?.maxStudents ?? 0;
        const confirmedReplacements = s.replacementBookings.length;
        const enrolledStudents = s.students.length;
        const availableSlots =
          maxStudents - enrolledStudents - confirmedReplacements;

        return {
          id: s.id,
          lessonDate: s.lessonDate,
          startTime: s.startTime,
          endTime: s.endTime,
          lessonType: s.lessonType,
          court: s.court,
          availableSlots,
          maxStudents,
        };
      })
      .filter((s) => s.availableSlots > 0);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/replacement/available error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
