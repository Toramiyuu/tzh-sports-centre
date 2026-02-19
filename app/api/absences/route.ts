import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  classifyAbsence,
  getAbsenceStatus,
  createReplacementCreditExpiry,
} from "@/lib/absence";
import { sanitiseText } from "@/lib/validation";
import { AbsenceType, AbsenceStatus } from "@prisma/client";

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
    const { lessonSessionId, isMedical, proofUrl } = body;
    const reason = sanitiseText(body.reason);

    if (
      proofUrl &&
      (typeof proofUrl !== "string" ||
        !proofUrl.startsWith("https://") ||
        proofUrl.length > 2048)
    ) {
      return NextResponse.json({ error: "Invalid proof URL" }, { status: 400 });
    }

    if (!lessonSessionId || typeof lessonSessionId !== "string") {
      return NextResponse.json(
        { error: "lessonSessionId is required" },
        { status: 400 },
      );
    }

    const lessonSession = await prisma.lessonSession.findFirst({
      where: {
        id: lessonSessionId,
        students: { some: { id: user.id } },
      },
      include: {
        court: { select: { name: true } },
      },
    });

    if (!lessonSession) {
      return NextResponse.json(
        { error: "Lesson session not found or user not enrolled" },
        { status: 400 },
      );
    }

    if (lessonSession.lessonDate <= new Date()) {
      return NextResponse.json(
        { error: "Cannot submit absence for a past lesson" },
        { status: 400 },
      );
    }

    const existing = await prisma.absence.findFirst({
      where: { userId: user.id, lessonSessionId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Absence already submitted for this session" },
        { status: 409 },
      );
    }

    const appliedAt = new Date();

    let type: AbsenceType;
    if (isMedical) {
      type = AbsenceType.MEDICAL;
    } else {
      type = classifyAbsence(appliedAt, lessonSession.lessonDate);
    }
    const status: AbsenceStatus = getAbsenceStatus(type);
    const isApply = type === AbsenceType.APPLY;

    const absence = await prisma.$transaction(async (tx) => {
      const created = await tx.absence.create({
        data: {
          userId: user.id,
          lessonSessionId,
          type,
          status,
          reason,
          proofUrl: proofUrl ?? null,
          lessonDate: lessonSession.lessonDate,
          appliedAt,
        },
      });

      if (isApply) {
        await tx.replacementCredit.create({
          data: {
            userId: user.id,
            absenceId: created.id,
            expiresAt: createReplacementCreditExpiry(appliedAt),
          },
        });
      }

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
        type: "absence_submitted",
        title: "Absence Recorded",
        message: `Your absence for the ${lessonDateStr} lesson has been recorded as ${type}.`,
        link: "/profile?tab=absences",
      },
    });

    return NextResponse.json({ absence }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Absence already submitted for this session" },
        { status: 409 },
      );
    }
    console.error("Absence POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const absences = await prisma.absence.findMany({
      where: { userId: user.id },
      include: {
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
      orderBy: { lessonDate: "desc" },
    });

    return NextResponse.json({ absences });
  } catch (error) {
    console.error("Absence GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { absenceId, proofUrl } = body;

    if (!absenceId || typeof absenceId !== "string") {
      return NextResponse.json(
        { error: "absenceId is required" },
        { status: 400 },
      );
    }

    if (!proofUrl || typeof proofUrl !== "string") {
      return NextResponse.json(
        { error: "proofUrl is required" },
        { status: 400 },
      );
    }

    const absence = await prisma.absence.findFirst({
      where: {
        id: absenceId,
        userId: user.id,
        status: AbsenceStatus.PENDING_REVIEW,
      },
    });

    if (!absence) {
      return NextResponse.json(
        { error: "Absence not found or not in PENDING_REVIEW status" },
        { status: 404 },
      );
    }

    const updated = await prisma.absence.update({
      where: { id: absenceId },
      data: { proofUrl },
    });

    return NextResponse.json({ absence: updated });
  } catch (error) {
    console.error("Absence PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
