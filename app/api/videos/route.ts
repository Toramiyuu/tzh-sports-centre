import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    let hasActiveSubscription = false;
    if (session?.user?.id) {
      const activeSub = await prisma.videoSubscription.findFirst({
        where: {
          userId: session.user.id,
          status: "active",
          expiryDate: { gte: new Date() },
        },
      });
      hasActiveSubscription = !!activeSub;
    }

    const videos = await prisma.video.findMany({
      where: { isActive: true },
      include: {
        creator: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.isExclusive && !hasActiveSubscription ? null : video.url,
      thumbnailUrl: video.thumbnailUrl,
      category: video.category,
      isExclusive: video.isExclusive,
      locked: video.isExclusive && !hasActiveSubscription,
      creator: video.creator,
      createdAt: video.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isContentCreator: true, isAdmin: true },
    });

    if (!user?.isContentCreator && !user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, url, thumbnailUrl, category, isExclusive } =
      body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 },
      );
    }

    const validCategories = [
      "technique",
      "drills",
      "match-analysis",
      "tips",
      null,
    ];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        url,
        thumbnailUrl: thumbnailUrl || null,
        category: category || null,
        isExclusive: isExclusive ?? false,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
