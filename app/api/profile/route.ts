import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getEmailVerificationEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        uid: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        creditBalance: true,
        createdAt: true,
        isMember: true,
        avatarUrl: true,
        notifyBookingConfirm: true,
        notifyBookingReminder: true,
        notifyCancellation: true,
        notifyLessonUpdates: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      uid: user.uid.toString().padStart(3, "0"),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, emergencyContact } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let emailVerificationSent = false;
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 },
        );
      }

      const verifyToken = crypto.randomUUID();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: email,
          emailVerifyToken: verifyToken,
          emailVerifyExpiry: expiry,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const verifyUrl = `${appUrl}/api/verify-email?token=${verifyToken}`;
      const emailTemplate = getEmailVerificationEmail({
        userName: user.name || "User",
        verifyUrl,
      });
      await sendEmail({ to: email, ...emailTemplate });
      emailVerificationSent = true;
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone && existingPhone.id !== user.id) {
        return NextResponse.json(
          { error: "Phone number already in use" },
          { status: 400 },
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        phone: phone || user.phone,
        emergencyContact:
          emergencyContact !== undefined
            ? emergencyContact
            : user.emergencyContact,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emergencyContact: true,
        creditBalance: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ...updatedUser, emailVerificationSent });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
