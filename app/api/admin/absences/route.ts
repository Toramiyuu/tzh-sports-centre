import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { validateAbsenceType } from "@/lib/validation";
import { AbsenceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get("type");
    const statusParam = searchParams.get("status");
    const userId = searchParams.get("userId");
    const dateStart = searchParams.get("dateStart");
    const dateEnd = searchParams.get("dateEnd");

    const where: Record<string, unknown> = {};

    if (typeParam) {
      const type = validateAbsenceType(typeParam);
      if (!type) {
        return NextResponse.json(
          { error: "Invalid type filter" },
          { status: 400 },
        );
      }
      where.type = type;
    }

    if (statusParam) {
      const validStatuses = Object.values(AbsenceStatus);
      if (!validStatuses.includes(statusParam as AbsenceStatus)) {
        return NextResponse.json(
          { error: "Invalid status filter" },
          { status: 400 },
        );
      }
      where.status = statusParam as AbsenceStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateStart || dateEnd) {
      const lessonDateFilter: Record<string, Date> = {};
      if (dateStart) lessonDateFilter.gte = new Date(dateStart);
      if (dateEnd) lessonDateFilter.lte = new Date(dateEnd);
      where.lessonDate = lessonDateFilter;
    }

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50),
    );

    const [absences, total] = await Promise.all([
      prisma.absence.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true },
          },
          lessonSession: {
            select: {
              lessonDate: true,
              startTime: true,
              endTime: true,
              court: { select: { name: true } },
            },
          },
          replacementCredit: {
            select: { id: true, usedAt: true, expiresAt: true },
          },
        },
        orderBy: { appliedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.absence.count({ where }),
    ]);

    return NextResponse.json({ absences, total, page, limit });
  } catch (error) {
    console.error("Admin absences GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
