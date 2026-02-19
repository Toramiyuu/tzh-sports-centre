import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { validateMonth } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
      100,
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (monthParam) {
      const month = validateMonth(monthParam);
      if (!month) {
        return NextResponse.json(
          { error: "Invalid month format (YYYY-MM)" },
          { status: 400 },
        );
      }
      const [y, m] = month.split("-");
      const start = new Date(`${y}-${m}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      where.date = { gte: start, lt: end };
    }

    const [sessions, total] = await Promise.all([
      prisma.gameSession.findMany({
        where,
        include: {
          court: { select: { name: true } },
          createdByUser: { select: { name: true } },
          _count: { select: { attendances: true, matches: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.gameSession.count({ where }),
    ]);

    return NextResponse.json({ sessions, total, page, limit });
  } catch (error) {
    console.error("GET /api/admin/game-sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { date, courtId, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    if (courtId !== undefined && courtId !== null) {
      const court = await prisma.court.findUnique({ where: { id: courtId } });
      if (!court) {
        return NextResponse.json({ error: "Court not found" }, { status: 400 });
      }
    }

    const gameSession = await prisma.gameSession.create({
      data: {
        date: parsedDate,
        courtId: courtId ?? null,
        notes: notes ?? null,
        createdBy: session.user.id!,
      },
    });

    return NextResponse.json({ session: gameSession }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/game-sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
