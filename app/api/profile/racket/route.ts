import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PRESETS = 3;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        racketProfile: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const racketProfiles = user.racketProfile || [];
    const defaultRacket =
      racketProfiles.find((r) => r.isDefault) || racketProfiles[0] || null;

    return NextResponse.json({
      racketProfile: defaultRacket,
      racketProfiles,
    });
  } catch (error) {
    console.error("Error fetching racket profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch racket profile" },
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { racketProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((user.racketProfile || []).length >= MAX_PRESETS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PRESETS} racket presets allowed` },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, brand, model, tensionMain, tensionCross, stringName } = body;

    if (!name?.trim() || !brand?.trim() || !model?.trim()) {
      return NextResponse.json(
        { error: "Name, brand, and model are required" },
        { status: 400 },
      );
    }

    const isFirst = (user.racketProfile || []).length === 0;

    const racketProfile = await prisma.racketProfile.create({
      data: {
        userId: user.id,
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        color: "",
        weight: "",
        stringName: stringName?.trim() || null,
        tensionMain: tensionMain || null,
        tensionCross: tensionCross || null,
        isDefault: isFirst,
      },
    });

    return NextResponse.json({ racketProfile });
  } catch (error) {
    console.error("Error creating racket profile:", error);
    return NextResponse.json(
      { error: "Failed to create racket profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { racketProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      id,
      name,
      brand,
      model,
      tensionMain,
      tensionCross,
      stringName,
      isDefault,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Racket profile ID is required" },
        { status: 400 },
      );
    }

    if (!name?.trim() || !brand?.trim() || !model?.trim()) {
      return NextResponse.json(
        { error: "Name, brand, and model are required" },
        { status: 400 },
      );
    }

    const racketProfiles = user.racketProfile || [];
    const targetRacket = racketProfiles.find((r) => r.id === id);
    if (!targetRacket) {
      return NextResponse.json({ error: "Racket not found" }, { status: 404 });
    }

    if (isDefault) {
      await prisma.racketProfile.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const racketProfile = await prisma.racketProfile.update({
      where: { id },
      data: {
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        stringName: stringName?.trim() || null,
        tensionMain: tensionMain || null,
        tensionCross: tensionCross || null,
        isDefault: isDefault ?? targetRacket.isDefault,
      },
    });

    return NextResponse.json({ racketProfile });
  } catch (error) {
    console.error("Error updating racket profile:", error);
    return NextResponse.json(
      { error: "Failed to update racket profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { racketProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Racket profile ID is required" },
        { status: 400 },
      );
    }

    const racketProfiles = user.racketProfile || [];
    const target = racketProfiles.find((r) => r.id === id);
    if (!target) {
      return NextResponse.json({ error: "Racket not found" }, { status: 404 });
    }

    await prisma.racketProfile.delete({ where: { id } });

    if (target.isDefault) {
      const remaining = racketProfiles.filter((r) => r.id !== id);
      if (remaining.length > 0) {
        await prisma.racketProfile.update({
          where: { id: remaining[0].id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting racket profile:", error);
    return NextResponse.json(
      { error: "Failed to delete racket profile" },
      { status: 500 },
    );
  }
}
