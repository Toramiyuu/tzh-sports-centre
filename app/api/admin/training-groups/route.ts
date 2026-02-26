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

    const groups = await prisma.trainingGroup.findMany({
      where: { isActive: true },
      include: {
        members: {
          select: {
            id: true,
            uid: true,
            name: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error fetching training groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch training groups" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, sport, notes, memberIds } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.trainingGroup.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 409 },
      );
    }

    const group = await prisma.trainingGroup.create({
      data: {
        name: name.trim(),
        sport: sport || "badminton",
        notes: notes || null,
        members: {
          connect: (memberIds || []).map((id: string) => ({ id })),
        },
      },
      include: {
        members: {
          select: {
            id: true,
            uid: true,
            name: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error("Error creating training group:", error);
    return NextResponse.json(
      { error: "Failed to create training group" },
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

    const { id, name, sport, notes, memberIds } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 },
      );
    }

    const group = await prisma.trainingGroup.findUnique({
      where: { id },
      include: { members: { select: { id: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (name && name.trim() !== group.name) {
      const duplicate = await prisma.trainingGroup.findUnique({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A group with this name already exists" },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (sport !== undefined) updateData.sport = sport;
    if (notes !== undefined) updateData.notes = notes || null;

    if (memberIds !== undefined) {
      updateData.members = {
        set: memberIds.map((mid: string) => ({ id: mid })),
      };
    }

    const updated = await prisma.trainingGroup.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          select: {
            id: true,
            uid: true,
            name: true,
            phone: true,
            skillLevel: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    console.error("Error updating training group:", error);
    return NextResponse.json(
      { error: "Failed to update training group" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 },
      );
    }

    await prisma.trainingGroup.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting training group:", error);
    return NextResponse.json(
      { error: "Failed to delete training group" },
      { status: 500 },
    );
  }
}
