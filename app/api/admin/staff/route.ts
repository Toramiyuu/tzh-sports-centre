import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  validateTeacherName,
  validateMalaysianPhone,
  validatePayRate,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeOnly = request.nextUrl.searchParams.get("active") !== "false";

    const teachers = await prisma.teacher.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        payRates: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, userId, payRates } = body;

    const validName = validateTeacherName(name);
    if (!validName) {
      return NextResponse.json(
        { error: "Name is required (1-100 characters)" },
        { status: 400 },
      );
    }

    if (phone) {
      const validPhone = validateMalaysianPhone(phone);
      if (!validPhone) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 },
        );
      }
    }

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }
      const existingTeacher = await prisma.teacher.findUnique({
        where: { userId },
      });
      if (existingTeacher) {
        return NextResponse.json(
          { error: "This user is already linked to a teacher" },
          { status: 400 },
        );
      }
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
      const created = await tx.teacher.create({
        data: {
          name: validName,
          phone: phone || null,
          userId: userId || null,
        },
      });

      if (validPayRates.length > 0) {
        await tx.teacherPayRate.createMany({
          data: validPayRates.map((pr) => ({
            teacherId: created.id,
            lessonType: pr.lessonType,
            rate: pr.rate,
          })),
        });
      }

      return tx.teacher.findUnique({
        where: { id: created.id },
        include: {
          payRates: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
