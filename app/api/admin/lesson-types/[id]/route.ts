import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { sanitiseText } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.lessonType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Lesson type not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const validName = sanitiseText(body.name);
      if (!validName || validName.length > 100) {
        return NextResponse.json(
          { error: "Name must be 1-100 characters" },
          { status: 400 },
        );
      }
      if (validName !== existing.name) {
        const duplicate = await prisma.lessonType.findUnique({
          where: { name: validName },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: "A lesson type with this name already exists" },
            { status: 400 },
          );
        }
      }
      updates.name = validName;
    }

    if (body.billingType !== undefined) {
      if (!["per_session", "monthly"].includes(body.billingType)) {
        return NextResponse.json(
          { error: "Billing type must be per_session or monthly" },
          { status: 400 },
        );
      }
      updates.billingType = body.billingType;
    }

    if (body.price !== undefined) {
      const numPrice = Number(body.price);
      if (isNaN(numPrice) || numPrice <= 0 || numPrice > 100000) {
        return NextResponse.json(
          { error: "Price must be a positive number (max 100,000)" },
          { status: 400 },
        );
      }
      updates.price = numPrice;
    }

    if (body.maxStudents !== undefined) {
      const num = Number(body.maxStudents);
      if (!Number.isInteger(num) || num < 1 || num > 50) {
        return NextResponse.json(
          { error: "Max students must be 1-50" },
          { status: 400 },
        );
      }
      updates.maxStudents = num;
    }

    if (body.slug !== undefined) {
      const slug = String(body.slug)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 100);
      if (!slug) {
        return NextResponse.json(
          { error: "Slug is required" },
          { status: 400 },
        );
      }
      if (slug !== existing.slug) {
        const duplicateSlug = await prisma.lessonType.findUnique({
          where: { slug },
        });
        if (duplicateSlug) {
          return NextResponse.json(
            { error: "A lesson type with this slug already exists" },
            { status: 400 },
          );
        }
      }
      updates.slug = slug;
    }

    if (body.description !== undefined) {
      updates.description = body.description
        ? sanitiseText(body.description)
        : null;
    }

    if (body.detailedDescription !== undefined) {
      updates.detailedDescription = body.detailedDescription
        ? sanitiseText(body.detailedDescription)
        : null;
    }

    if (body.sessionsPerMonth !== undefined) {
      updates.sessionsPerMonth = body.sessionsPerMonth
        ? Number(body.sessionsPerMonth)
        : null;
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (body.pricingTiers !== undefined && Array.isArray(body.pricingTiers)) {
      await prisma.lessonTypePricing.deleteMany({
        where: { lessonTypeId: id },
      });
      const validTiers: {
        lessonTypeId: string;
        duration: number;
        price: number;
      }[] = [];
      for (const tier of body.pricingTiers) {
        const d = Number(tier.duration);
        const p = Number(tier.price);
        if (isNaN(d) || d <= 0 || d > 10) continue;
        if (isNaN(p) || p <= 0 || p > 100000) continue;
        validTiers.push({ lessonTypeId: id, duration: d, price: p });
      }
      if (validTiers.length > 0) {
        await prisma.lessonTypePricing.createMany({ data: validTiers });
      }
    }

    const lessonType = await prisma.lessonType.update({
      where: { id },
      data: updates,
      include: { pricingTiers: { orderBy: { duration: "asc" } } },
    });

    return NextResponse.json({ lessonType });
  } catch (error) {
    console.error("Error updating lesson type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
