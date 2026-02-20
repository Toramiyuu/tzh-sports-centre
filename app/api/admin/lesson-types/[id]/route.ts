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

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    const lessonType = await prisma.lessonType.update({
      where: { id },
      data: updates,
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
