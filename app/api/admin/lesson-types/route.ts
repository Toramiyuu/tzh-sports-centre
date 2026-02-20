import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitiseText } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeOnly = request.nextUrl.searchParams.get("active") !== "false";

    const lessonTypes = await prisma.lessonType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { pricingTiers: { orderBy: { duration: "asc" } } },
      orderBy: { name: "asc" },
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, billingType, price, maxStudents, pricingTiers } = body;

    const validName = sanitiseText(name);
    if (!validName || validName.length > 100) {
      return NextResponse.json(
        { error: "Name is required (1-100 characters)" },
        { status: 400 },
      );
    }

    if (!billingType || !["per_session", "monthly"].includes(billingType)) {
      return NextResponse.json(
        { error: "Billing type must be per_session or monthly" },
        { status: 400 },
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0 || numPrice > 100000) {
      return NextResponse.json(
        { error: "Price must be a positive number (max 100,000)" },
        { status: 400 },
      );
    }

    const numMaxStudents = maxStudents ? Number(maxStudents) : 1;
    if (
      !Number.isInteger(numMaxStudents) ||
      numMaxStudents < 1 ||
      numMaxStudents > 50
    ) {
      return NextResponse.json(
        { error: "Max students must be 1-50" },
        { status: 400 },
      );
    }

    const existing = await prisma.lessonType.findUnique({
      where: { name: validName },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A lesson type with this name already exists" },
        { status: 400 },
      );
    }

    const validTiers: { duration: number; price: number }[] = [];
    if (pricingTiers && Array.isArray(pricingTiers)) {
      for (const tier of pricingTiers) {
        const d = Number(tier.duration);
        const p = Number(tier.price);
        if (isNaN(d) || d <= 0 || d > 10) continue;
        if (isNaN(p) || p <= 0 || p > 100000) continue;
        validTiers.push({ duration: d, price: p });
      }
    }

    const lessonType = await prisma.lessonType.create({
      data: {
        name: validName,
        billingType,
        price: numPrice,
        maxStudents: numMaxStudents,
        pricingTiers:
          validTiers.length > 0
            ? { createMany: { data: validTiers } }
            : undefined,
      },
      include: { pricingTiers: { orderBy: { duration: "asc" } } },
    });

    return NextResponse.json({ lessonType }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
