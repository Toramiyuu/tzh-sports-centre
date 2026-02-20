import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        isMember: true,
        isTrainee: true,
        skillLevel: true,
        createdAt: true,
        _count: {
          select: {
            lessonSessions: true,
          },
        },
      },
      orderBy: [{ isMember: "desc" }, { name: "asc" }],
    });

    const serializedUsers = users.map((u) => ({
      ...u,
      uid: u.uid.toString().padStart(3, "0"),
    }));

    const members = serializedUsers.filter((u) => u.isMember);
    const nonMembers = serializedUsers.filter((u) => !u.isMember);

    return NextResponse.json({ members, nonMembers, all: serializedUsers });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, isMember, isTrainee, skillLevel } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const updateData: {
      isMember?: boolean;
      isTrainee?: boolean;
      skillLevel?: string | null;
    } = {};

    if (typeof isMember === "boolean") {
      updateData.isMember = isMember;
      if (!isMember) {
        updateData.skillLevel = null;
      }
    }

    if (typeof isTrainee === "boolean") {
      updateData.isTrainee = isTrainee;
    }

    if (skillLevel !== undefined) {
      updateData.skillLevel = skillLevel;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        isMember: true,
        isTrainee: true,
        skillLevel: true,
      },
    });

    return NextResponse.json({
      user: {
        ...updatedUser,
        uid: updatedUser.uid.toString().padStart(3, "0"),
      },
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 },
    );
  }
}
