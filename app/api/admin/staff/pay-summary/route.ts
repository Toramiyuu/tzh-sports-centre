import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { validateMonth } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthParam =
      request.nextUrl.searchParams.get("month") || defaultMonth;

    const validMonth = validateMonth(monthParam);
    if (!validMonth) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 },
      );
    }

    const [year, month] = validMonth.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const teachers = await prisma.teacher.findMany({
      where: { isActive: true },
      include: { payRates: true },
    });

    const lessons = await prisma.lessonSession.findMany({
      where: {
        teacherId: { not: null },
        lessonDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["scheduled", "completed"] },
      },
    });

    const ratesMap = new Map<string, Map<string, number>>();
    for (const teacher of teachers) {
      const typeMap = new Map<string, number>();
      for (const pr of teacher.payRates) {
        typeMap.set(pr.lessonType, pr.rate);
      }
      ratesMap.set(teacher.id, typeMap);
    }

    const teacherLessons = new Map<
      string,
      { lessons: typeof lessons; totalPay: number }
    >();

    for (const lesson of lessons) {
      if (!lesson.teacherId) continue;
      if (!teacherLessons.has(lesson.teacherId)) {
        teacherLessons.set(lesson.teacherId, { lessons: [], totalPay: 0 });
      }
      const entry = teacherLessons.get(lesson.teacherId)!;
      const rate = ratesMap.get(lesson.teacherId)?.get(lesson.lessonType) ?? 0;
      entry.lessons.push(lesson);
      entry.totalPay += rate;
    }

    const teacherMap = new Map(teachers.map((t) => [t.id, t]));
    const summary = Array.from(teacherLessons.entries()).map(
      ([teacherId, data]) => ({
        teacherId,
        teacherName: teacherMap.get(teacherId)?.name ?? "Unknown",
        totalSessions: data.lessons.length,
        totalPay: data.totalPay,
        lessons: data.lessons.map((l) => ({
          id: l.id,
          lessonType: l.lessonType,
          lessonDate: l.lessonDate,
          startTime: l.startTime,
          endTime: l.endTime,
          duration: l.duration,
          status: l.status,
          rate: ratesMap.get(teacherId)?.get(l.lessonType) ?? 0,
        })),
      }),
    );

    return NextResponse.json({ summary, month: validMonth });
  } catch (error) {
    console.error("Error fetching pay summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
