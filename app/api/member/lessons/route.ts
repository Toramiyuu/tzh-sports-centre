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
      select: { id: true, isTrainee: true },
    });

    if (!user || !user.isTrainee) {
      return NextResponse.json({ error: "Not a trainee" }, { status: 403 });
    }

    const lessons = await prisma.lessonSession.findMany({
      where: {
        students: {
          some: { id: user.id },
        },
      },
      include: {
        court: true,
        students: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lessonDate: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Error fetching member lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 },
    );
  }
}
