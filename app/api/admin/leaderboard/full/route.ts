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

    const monthParam = request.nextUrl.searchParams.get("month");
    let month: string;

    if (monthParam) {
      const validated = validateMonth(monthParam);
      if (!validated) {
        return NextResponse.json(
          { error: "Invalid month format (YYYY-MM)" },
          { status: 400 },
        );
      }
      month = validated;
    } else {
      const now = new Date();
      month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    }

    const records = await prisma.playerPoints.findMany({
      where: { month },
      include: {
        user: {
          select: {
            name: true,
            playerProfile: { select: { group: true } },
          },
        },
      },
      orderBy: { totalPoints: "desc" },
      take: 500,
    });

    const leaderboard = records.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      playerName: r.user.name,
      group: r.user.playerProfile?.group ?? "ACTIVE",
      month: r.month,
      attendancePoints: r.attendancePoints,
      gamesPoints: r.gamesPoints,
      winsPoints: r.winsPoints,
      bonusPoints: r.bonusPoints,
      totalPoints: r.totalPoints,
    }));

    return NextResponse.json({ leaderboard, month });
  } catch (error) {
    console.error("GET leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
