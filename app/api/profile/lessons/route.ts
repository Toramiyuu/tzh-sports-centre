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

    const upcoming = request.nextUrl.searchParams.get("upcoming") === "true";

    const where: Record<string, unknown> = {
      students: { some: { id: user.id } },
    };

    if (upcoming) {
      where.lessonDate = { gt: new Date() };
    }

    const sessions = await prisma.lessonSession.findMany({
      where,
      include: {
        court: { select: { name: true } },
      },
      orderBy: { lessonDate: upcoming ? "asc" : "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Lessons fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 },
    );
  }
}
