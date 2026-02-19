import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { recalculateMonthlyPoints } from "@/lib/gamification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array" },
        { status: 400 },
      );
    }

    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!gameSession) {
      return NextResponse.json(
        { error: "Game session not found" },
        { status: 404 },
      );
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: "One or more users not found" },
        { status: 400 },
      );
    }

    const existing = await prisma.sessionAttendance.findMany({
      where: { sessionId, userId: { in: userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((a) => a.userId));
    const newUserIds = userIds.filter((id: string) => !existingIds.has(id));

    if (newUserIds.length > 0) {
      await prisma.sessionAttendance.createMany({
        data: newUserIds.map((userId: string) => ({ sessionId, userId })),
      });
    }

    const sessionDate = gameSession.date;
    const month = `${sessionDate.getUTCFullYear()}-${String(sessionDate.getUTCMonth() + 1).padStart(2, "0")}`;

    for (const userId of userIds) {
      await recalculateMonthlyPoints(userId, month, prisma);
    }

    return NextResponse.json({
      recorded: newUserIds.length,
      skipped: existingIds.size,
    });
  } catch (error) {
    console.error("POST attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
