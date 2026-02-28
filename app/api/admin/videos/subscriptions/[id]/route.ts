import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const subscription = await prisma.videoSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    if (subscription.status !== "pending") {
      return NextResponse.json(
        { error: "Subscription is not pending" },
        { status: 400 },
      );
    }

    const now = new Date();

    if (action === "approve") {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 30);

      const updated = await prisma.videoSubscription.update({
        where: { id },
        data: {
          status: "active",
          startDate: now,
          expiryDate,
          approvedBy: session.user.email,
          approvedAt: now,
        },
      });

      return NextResponse.json(updated);
    } else {
      const updated = await prisma.videoSubscription.update({
        where: { id },
        data: {
          status: "cancelled",
          approvedBy: session.user.email,
          approvedAt: now,
        },
      });

      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
