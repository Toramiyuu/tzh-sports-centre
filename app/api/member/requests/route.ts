import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isTrainee: true },
    });

    if (!user || !user.isTrainee) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const requests = await prisma.lessonRequest.findMany({
      where: { memberId: user.id },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching member requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
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
      select: { id: true, isTrainee: true },
    });

    if (!user || !user.isTrainee) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();
    const {
      requestedDate,
      requestedTime,
      lessonType,
      requestedDuration,
      notes,
    } = body;

    if (!requestedDate || !requestedTime || !lessonType) {
      return NextResponse.json(
        { error: "Date, time, and lesson type are required" },
        { status: 400 },
      );
    }

    const lessonTypeRecord = await prisma.lessonType.findUnique({
      where: { slug: lessonType },
      include: { pricingTiers: { orderBy: { duration: "asc" } } },
    });
    if (!lessonTypeRecord || !lessonTypeRecord.isActive) {
      return NextResponse.json(
        { error: "Invalid lesson type" },
        { status: 400 },
      );
    }

    if (lessonTypeRecord.billingType === "monthly") {
      return NextResponse.json(
        {
          error:
            "Monthly billing lessons are managed by admin only. Please contact the coach directly.",
        },
        { status: 400 },
      );
    }

    const allowedDurations = lessonTypeRecord.pricingTiers.map(
      (t) => t.duration,
    );
    const defaultDuration =
      allowedDurations.length > 0 ? allowedDurations[0] : 1.5;
    const duration = requestedDuration || defaultDuration;

    if (allowedDurations.length > 0 && !allowedDurations.includes(duration)) {
      return NextResponse.json(
        {
          error: `Invalid duration for ${lessonTypeRecord.name}. Allowed: ${allowedDurations.join(", ")} hours`,
        },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.lessonRequest.findFirst({
      where: {
        memberId: user.id,
        requestedDate: new Date(requestedDate),
        requestedTime,
        status: "pending",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request for this time" },
        { status: 409 },
      );
    }

    const lessonRequest = await prisma.lessonRequest.create({
      data: {
        memberId: user.id,
        requestedDate: new Date(requestedDate),
        requestedTime,
        lessonType,
        requestedDuration: duration,
        adminNotes: notes || null,
        status: "pending",
      },
    });

    return NextResponse.json({ request: lessonRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isTrainee: true },
    });

    if (!user || !user.isTrainee) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action, newTime } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.lessonRequest.findFirst({
      where: {
        id: requestId,
        memberId: user.id,
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "accept") {
      const updatedRequest = await prisma.lessonRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          requestedTime:
            existingRequest.suggestedTime || existingRequest.requestedTime,
          adminNotes:
            (existingRequest.adminNotes || "") +
            " [Member accepted suggested time]",
        },
      });
      return NextResponse.json({ request: updatedRequest });
    } else if (action === "counter") {
      if (!newTime) {
        return NextResponse.json(
          { error: "New time is required for counter-proposal" },
          { status: 400 },
        );
      }
      const updatedRequest = await prisma.lessonRequest.update({
        where: { id: requestId },
        data: {
          status: "pending",
          requestedTime: newTime,
          suggestedTime: null,
          adminNotes:
            (existingRequest.adminNotes || "") +
            ` [Member counter-proposed: ${newTime}]`,
        },
      });
      return NextResponse.json({ request: updatedRequest });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "counter"' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error responding to request:", error);
    return NextResponse.json(
      { error: "Failed to respond to request" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isTrainee: true },
    });

    if (!user || !user.isTrainee) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 },
      );
    }

    const existingRequest = await prisma.lessonRequest.findFirst({
      where: {
        id: requestId,
        memberId: user.id,
        status: "pending",
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Request not found or cannot be cancelled" },
        { status: 404 },
      );
    }

    await prisma.lessonRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling request:", error);
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 },
    );
  }
}
