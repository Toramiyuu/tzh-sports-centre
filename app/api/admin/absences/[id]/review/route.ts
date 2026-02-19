import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitiseText } from "@/lib/validation";
import { createReplacementCreditExpiry } from "@/lib/absence";
import { AbsenceStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { creditAwarded } = body;
    const adminNotes = sanitiseText(body.adminNotes);

    if (typeof creditAwarded !== "boolean") {
      return NextResponse.json(
        { error: "creditAwarded (boolean) is required" },
        { status: 400 },
      );
    }

    const reviewedAt = new Date();
    const reviewedBy = session.user.email ?? session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.absence.updateMany({
        where: { id, status: AbsenceStatus.PENDING_REVIEW },
        data: {
          status: AbsenceStatus.REVIEWED,
          creditAwarded,
          adminNotes,
          reviewedBy,
          reviewedAt,
        },
      });

      if (count === 0) {
        return null;
      }

      if (creditAwarded) {
        await tx.replacementCredit.create({
          data: {
            userId: (
              await tx.absence.findUniqueOrThrow({
                where: { id },
                select: { userId: true },
              })
            ).userId,
            absenceId: id,
            expiresAt: createReplacementCreditExpiry(reviewedAt),
          },
        });
      }

      return await tx.absence.findUnique({ where: { id } });
    });

    if (!result) {
      return NextResponse.json(
        { error: "Absence not found or not in PENDING_REVIEW status" },
        { status: 400 },
      );
    }

    await prisma.notification.create({
      data: {
        userId: result.userId,
        type: "absence_reviewed",
        title: creditAwarded
          ? "Replacement Credit Awarded"
          : "Absence Reviewed",
        message: creditAwarded
          ? "Your medical absence has been reviewed and a replacement credit has been awarded."
          : "Your medical absence has been reviewed.",
        link: "/profile?tab=absences",
      },
    });

    return NextResponse.json({ absence: result });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Credit already awarded for this absence" },
        { status: 409 },
      );
    }
    console.error("Admin absence review PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
