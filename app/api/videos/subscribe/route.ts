import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.videoSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["pending", "active"] },
      },
    });

    if (
      existing?.status === "active" &&
      existing.expiryDate &&
      existing.expiryDate > new Date()
    ) {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 },
      );
    }

    if (existing?.status === "pending") {
      return NextResponse.json(
        { error: "You already have a pending subscription request" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { paymentMethod, receiptUrl, amount } = body;

    if (!paymentMethod || !receiptUrl || !amount) {
      return NextResponse.json(
        { error: "Payment method, receipt URL, and amount are required" },
        { status: 400 },
      );
    }

    if (!["tng", "duitnow"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const subscription = await prisma.videoSubscription.create({
      data: {
        userId: session.user.id,
        status: "pending",
        amount: parseFloat(amount),
        paymentMethod,
        receiptUrl,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
