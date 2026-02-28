import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.videoSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["pending", "active"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({ status: "none" });
    }

    if (
      subscription.status === "active" &&
      subscription.expiryDate &&
      subscription.expiryDate < new Date()
    ) {
      await prisma.videoSubscription.update({
        where: { id: subscription.id },
        data: { status: "expired" },
      });
      return NextResponse.json({ status: "expired" });
    }

    return NextResponse.json({
      status: subscription.status,
      startDate: subscription.startDate,
      expiryDate: subscription.expiryDate,
      amount: subscription.amount,
      paymentMethod: subscription.paymentMethod,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
