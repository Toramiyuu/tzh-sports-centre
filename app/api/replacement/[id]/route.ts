import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const booking = await prisma.replacementBooking.findFirst({
      where: { id, userId: user.id, status: "CONFIRMED" },
      include: {
        lessonSession: {
          select: {
            lessonDate: true,
            startTime: true,
            endTime: true,
            court: { select: { name: true } },
          },
        },
        replacementCredit: { select: { id: true, expiresAt: true } },
      },
    });
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or not cancellable" },
        { status: 404 },
      );
    }

    const now = new Date();
    const sessionDate = booking.lessonSession.lessonDate;
    const hoursUntilSession =
      (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const creditNotExpired = booking.replacementCredit.expiresAt > now;
    const creditReturned = hoursUntilSession > 24 && creditNotExpired;

    await prisma.$transaction(async (tx) => {
      await tx.replacementBooking.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      if (creditReturned) {
        await tx.replacementCredit.update({
          where: { id: booking.replacementCredit.id },
          data: { usedAt: null },
        });
      }
    });

    const lessonDateStr = sessionDate.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const message = creditReturned
      ? `Your replacement for ${lessonDateStr} has been cancelled. Credit returned.`
      : `Your replacement for ${lessonDateStr} has been cancelled. Credit was not returned (within 24 hours of session).`;

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "replacement_cancelled",
        title: "Replacement Cancelled",
        message,
        link: "/profile?tab=absences",
      },
    });

    return NextResponse.json({ success: true, creditReturned });
  } catch (error) {
    console.error("DELETE /api/replacement/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
