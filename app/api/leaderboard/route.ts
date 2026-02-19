import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateMonth } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          select: { name: true },
        },
      },
      orderBy: { totalPoints: "desc" },
      take: 100,
    });

    const leaderboard = records.map((r, index) => ({
      rank: index + 1,
      playerName: r.user.name,
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
