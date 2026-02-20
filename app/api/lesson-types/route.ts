import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lessonTypes = await prisma.lessonType.findMany({
      where: { isActive: true },
      include: { pricingTiers: { orderBy: { duration: "asc" } } },
      orderBy: [{ billingType: "asc" }, { price: "asc" }],
    });

    return NextResponse.json({ lessonTypes });
  } catch (error) {
    console.error("Error fetching lesson types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
