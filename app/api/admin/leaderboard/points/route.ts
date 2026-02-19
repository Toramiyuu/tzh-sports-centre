import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { validateMonth } from "@/lib/validation";

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
    const { userId, points, month: monthRaw, reason } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (typeof points !== "number" || points === 0) {
      return NextResponse.json(
        { error: "points must be a non-zero number" },
        { status: 400 },
      );
    }

    let month: string;
    if (monthRaw) {
      const validated = validateMonth(monthRaw);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const record = await prisma.playerPoints.upsert({
      where: { userId_month: { userId, month } },
      update: {
        bonusPoints: { increment: points },
        totalPoints: { increment: points },
      },
      create: {
        userId,
        month,
        bonusPoints: points,
        totalPoints: points,
      },
    });

    return NextResponse.json({
      success: true,
      playerName: user.name,
      month,
      bonusPoints: record.bonusPoints,
      totalPoints: record.totalPoints,
      reason: reason || null,
    });
  } catch (error) {
    console.error("POST award points error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
