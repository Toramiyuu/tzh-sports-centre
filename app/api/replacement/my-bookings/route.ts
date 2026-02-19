import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const bookings = await prisma.replacementBooking.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        lessonSession: { lessonDate: { gt: new Date() } },
      },
      include: {
        lessonSession: {
          select: {
            id: true,
            lessonDate: true,
            startTime: true,
            endTime: true,
            lessonType: true,
            court: { select: { name: true } },
          },
        },
        replacementCredit: {
          select: { id: true, absence: { select: { lessonDate: true } } },
        },
      },
      orderBy: { lessonSession: { lessonDate: "asc" } },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET /api/replacement/my-bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
