import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json(
        { error: "Not a registered teacher" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {
      teacherId: teacher.id,
      status: { in: ["scheduled", "completed"] },
    };

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.lessonDate = dateFilter;
    }

    const lessons = await prisma.lessonSession.findMany({
      where,
      include: {
        court: { select: { id: true, name: true } },
        students: {
          select: { id: true, name: true, phone: true, skillLevel: true },
        },
        attendances: {
          select: { userId: true, status: true },
        },
      },
      orderBy: [{ lessonDate: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      teacher: { id: teacher.id, name: teacher.name },
      lessons,
    });
  } catch (error) {
    console.error("Error fetching teacher lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 },
    );
  }
}
