import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ReplacementBookingStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
      100,
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (statusParam) {
      const validStatuses = Object.values(ReplacementBookingStatus);
      if (!validStatuses.includes(statusParam as ReplacementBookingStatus)) {
        return NextResponse.json(
          { error: "Invalid status filter" },
          { status: 400 },
        );
      }
      where.status = statusParam;
    }

    const [bookings, total] = await Promise.all([
      prisma.replacementBooking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          lessonSession: {
            select: {
              lessonDate: true,
              startTime: true,
              endTime: true,
              lessonType: true,
              court: { select: { name: true } },
            },
          },
          replacementCredit: {
            include: {
              absence: { select: { lessonDate: true, type: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.replacementBooking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, limit });
  } catch (error) {
    console.error("GET /api/admin/replacement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
