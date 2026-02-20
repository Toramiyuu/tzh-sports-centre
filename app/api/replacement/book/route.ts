import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { creditId, lessonSessionId } = body;

    if (!creditId || typeof creditId !== "string") {
      return NextResponse.json(
        { error: "creditId is required" },
        { status: 400 },
      );
    }
    if (!lessonSessionId || typeof lessonSessionId !== "string") {
      return NextResponse.json(
        { error: "lessonSessionId is required" },
        { status: 400 },
      );
    }

    const credit = await prisma.replacementCredit.findFirst({
      where: { id: creditId, userId: user.id },
      include: {
        absence: {
          include: { lessonSession: { select: { lessonType: true } } },
        },
      },
    });
    if (!credit) {
      return NextResponse.json(
        { error: "Replacement credit not found" },
        { status: 404 },
      );
    }
    if (credit.usedAt !== null) {
      return NextResponse.json(
        { error: "Replacement credit has already been used" },
        { status: 400 },
      );
    }
    if (credit.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Replacement credit has expired" },
        { status: 400 },
      );
    }

    const lessonSession = await prisma.lessonSession.findFirst({
      where: {
        id: lessonSessionId,
        status: "scheduled",
        lessonDate: { gt: new Date() },
        students: { none: { id: user.id } },
      },
      include: {
        students: { select: { id: true } },
        replacementBookings: {
          where: { status: "CONFIRMED" },
          select: { id: true },
        },
        court: { select: { name: true } },
      },
    });
    if (!lessonSession) {
      return NextResponse.json(
        { error: "Lesson session not found or not available" },
        { status: 404 },
      );
    }

    const originalLessonType = credit.absence.lessonSession.lessonType;
    if (originalLessonType !== lessonSession.lessonType) {
      return NextResponse.json(
        { error: "Replacement must be for the same lesson type" },
        { status: 400 },
      );
    }

    const lessonTypeRecord = await prisma.lessonType.findUnique({
      where: { slug: lessonSession.lessonType },
      select: { maxStudents: true },
    });
    const maxStudents = lessonTypeRecord?.maxStudents ?? 0;
    const usedSlots =
      lessonSession.students.length + lessonSession.replacementBookings.length;
    if (usedSlots >= maxStudents) {
      return NextResponse.json(
        { error: "No available slots in this session" },
        { status: 409 },
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const currentSession = await tx.lessonSession.findFirst({
        where: { id: lessonSessionId },
        include: {
          students: { select: { id: true } },
          replacementBookings: {
            where: { status: "CONFIRMED" },
            select: { id: true },
          },
        },
      });

      if (!currentSession) {
        throw new Error("Session not found");
      }

      const currentUsed =
        currentSession.students.length +
        currentSession.replacementBookings.length;
      if (currentUsed >= maxStudents) {
        throw Object.assign(new Error("No available slots"), {
          code: "SLOT_FULL",
        });
      }

      const currentCredit = await tx.replacementCredit.findFirst({
        where: { id: creditId, userId: user.id, usedAt: null },
      });
      if (!currentCredit || currentCredit.expiresAt <= new Date()) {
        throw Object.assign(new Error("Credit no longer available"), {
          code: "CREDIT_UNAVAILABLE",
        });
      }

      const existingReplacement = await tx.replacementBooking.findFirst({
        where: { userId: user.id, lessonSessionId, status: "CONFIRMED" },
      });
      if (existingReplacement) {
        throw Object.assign(new Error("Already booked"), {
          code: "ALREADY_BOOKED",
        });
      }

      const created = await tx.replacementBooking.create({
        data: {
          userId: user.id,
          replacementCreditId: creditId,
          lessonSessionId,
          status: "CONFIRMED",
        },
      });

      await tx.replacementCredit.update({
        where: { id: creditId },
        data: { usedAt: new Date() },
      });

      return created;
    });

    const lessonDateStr = lessonSession.lessonDate.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "replacement_booked",
        title: "Replacement Session Booked",
        message: `Your replacement session on ${lessonDateStr} at ${lessonSession.startTime} (${lessonSession.court.name}) has been confirmed. 1 credit used.`,
        link: "/profile?tab=absences",
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error as { code?: string }).code === "SLOT_FULL"
    ) {
      return NextResponse.json(
        { error: "No available slots in this session" },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      (error as { code?: string }).code === "CREDIT_UNAVAILABLE"
    ) {
      return NextResponse.json(
        { error: "Credit is no longer available" },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      (error as { code?: string }).code === "ALREADY_BOOKED"
    ) {
      return NextResponse.json(
        { error: "Already booked for this session" },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This credit has already been used for a booking" },
        { status: 409 },
      );
    }
    console.error("POST /api/replacement/book error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
