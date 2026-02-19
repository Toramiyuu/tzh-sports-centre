import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  validateTeacherName,
  validateMalaysianPhone,
  validatePayRate,
} from "@/lib/validation";

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
    const { name, phone, userId, isActive, payRates } = body;

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

    const validPayRates: { lessonType: string; rate: number }[] = [];
    if (payRates && Array.isArray(payRates)) {
      for (const pr of payRates) {
        if (!pr.lessonType || typeof pr.lessonType !== "string") {
          return NextResponse.json(
            { error: "Each pay rate must have a lessonType" },
            { status: 400 },
          );
        }
        const validRate = validatePayRate(pr.rate);
        if (!validRate) {
          return NextResponse.json(
            { error: `Invalid rate for ${pr.lessonType}` },
            { status: 400 },
          );
        }
        validPayRates.push({ lessonType: pr.lessonType, rate: validRate });
      }
    }

    const teacher = await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id },
        data: updateData,
      });

      if (payRates && Array.isArray(payRates)) {
        await tx.teacherPayRate.deleteMany({ where: { teacherId: id } });
        if (validPayRates.length > 0) {
          await tx.teacherPayRate.createMany({
            data: validPayRates.map((pr) => ({
              teacherId: id,
              lessonType: pr.lessonType,
              rate: pr.rate,
            })),
          });
        }
      }

      return tx.teacher.findUnique({
        where: { id },
        include: {
          payRates: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });
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
