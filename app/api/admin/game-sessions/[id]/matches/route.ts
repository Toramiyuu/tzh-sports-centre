import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  recalculateMonthlyPoints,
  updatePlayerGroup,
} from "@/lib/gamification";

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
    const { team1, team2, team1Score, team2Score } = body;

    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!gameSession) {
      return NextResponse.json(
        { error: "Game session not found" },
        { status: 404 },
      );
    }

    if (
      typeof team1Score !== "number" ||
      typeof team2Score !== "number" ||
      team1Score < 0 ||
      team2Score < 0
    ) {
      return NextResponse.json(
        { error: "Scores must be non-negative numbers" },
        { status: 400 },
      );
    }

    if (team1Score === team2Score) {
      return NextResponse.json(
        { error: "Scores cannot be equal — every match must have a winner" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(team1) ||
      !Array.isArray(team2) ||
      team1.length !== 2 ||
      team2.length !== 2
    ) {
      return NextResponse.json(
        { error: "Each team must have exactly 2 players" },
        { status: 400 },
      );
    }

    const allPlayerIds = [...team1, ...team2];
    const uniquePlayerIds = new Set(allPlayerIds);
    if (uniquePlayerIds.size !== 4) {
      return NextResponse.json(
        { error: "Duplicate players across teams" },
        { status: 400 },
      );
    }

    const attendances = await prisma.sessionAttendance.findMany({
      where: { sessionId, userId: { in: allPlayerIds } },
      select: { userId: true },
    });
    const attendedIds = new Set(attendances.map((a) => a.userId));
    const missing = allPlayerIds.filter((id) => !attendedIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Players missing attendance for this session: ${missing.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const team1Wins = team1Score > team2Score;

    const sessionDate = gameSession.date;
    const month = `${sessionDate.getUTCFullYear()}-${String(sessionDate.getUTCMonth() + 1).padStart(2, "0")}`;

    const match = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.match.count({
        where: { sessionId },
      });

      const created = await tx.match.create({
        data: {
          sessionId,
          matchNumber: existingCount + 1,
          team1Score,
          team2Score,
        },
      });

      const playerData = [
        ...team1.map((userId: string) => ({
          matchId: created.id,
          userId,
          team: 1,
          isWinner: team1Wins,
        })),
        ...team2.map((userId: string) => ({
          matchId: created.id,
          userId,
          team: 2,
          isWinner: !team1Wins,
        })),
      ];

      await tx.matchPlayer.createMany({ data: playerData });

      for (const userId of allPlayerIds) {
        await recalculateMonthlyPoints(userId, month, tx);
        await updatePlayerGroup(userId, tx);
      }

      return created;
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error("POST match error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
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

    const matches = await prisma.match.findMany({
      where: { sessionId },
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { matchNumber: "asc" },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("GET matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
