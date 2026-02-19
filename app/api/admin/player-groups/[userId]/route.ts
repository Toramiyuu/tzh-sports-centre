import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { validatePlayerGroup } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { group, override } = body;

    const validGroup = validatePlayerGroup(group);
    if (!validGroup) {
      return NextResponse.json(
        { error: "Invalid group value. Must be ELITE or ACTIVE" },
        { status: 400 },
      );
    }

    const existing = await prisma.playerProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Player profile not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.playerProfile.update({
      where: { userId },
      data: {
        group: validGroup,
        groupOverride: Boolean(override),
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("PATCH player-groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
