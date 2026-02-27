import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  validateTeacherName,
  validateMalaysianPhone,
  validatePayRate,
} from "@/lib/validation";

const VALID_ROLES = ["TEACHER", "COACH_ASSISTANT"] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, phone, userId, isActive, hourlyRate, role } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      const validName = validateTeacherName(name);
      if (!validName) {
        return NextResponse.json(
          { error: "Name must be 1-100 characters" },
          { status: 400 },
        );
      }
      updateData.name = validName;
    }

    if (phone !== undefined) {
      if (phone === null || phone === "") {
        updateData.phone = null;
      } else {
        const validPhone = validateMalaysianPhone(phone);
        if (!validPhone) {
          return NextResponse.json(
            { error: "Invalid phone number" },
            { status: 400 },
          );
        }
        updateData.phone = phone;
      }
    }

    if (userId !== undefined) {
      updateData.userId = userId || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be TEACHER or COACH_ASSISTANT" },
          { status: 400 },
        );
      }
      updateData.role = role;
    }

    if (hourlyRate !== undefined) {
      const validRate = validatePayRate(hourlyRate);
      if (validRate === null) {
        return NextResponse.json(
          { error: "Invalid hourly rate" },
          { status: 400 },
        );
      }
      updateData.hourlyRate = validRate;
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
      include: {
        payRates: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
