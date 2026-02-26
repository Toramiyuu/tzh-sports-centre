import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";
import {
  calculateHours,
  calculateBookingAmount,
  countSessionsInMonth,
} from "@/lib/recurring-booking-utils";
import { getLessonBillingForMonth } from "@/lib/lesson-billing-utils";
import { getDetailedBreakdown } from "./breakdown";

const TIMEZONE = "Asia/Kuala_Lumpur";

/** Shared helper: sum booking + recurring amounts for a user */
function calculateBookingTotals(
  user: {
    bookings: Array<{
      totalAmount: number;
      startTime: string;
      endTime: string;
    }>;
    recurringBookings: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      hourlyRate: number | null;
      sport: string;
      court: { name: string };
    }>;
  },
  year: number,
  month: number,
) {
  let totalAmount = 0;
  let totalHours = 0;
  let bookingsCount = user.bookings.length;

  for (const booking of user.bookings) {
    totalAmount += booking.totalAmount;
    totalHours += calculateHours(booking.startTime, booking.endTime);
  }

  for (const rb of user.recurringBookings) {
    const sessions = countSessionsInMonth(year, month, rb.dayOfWeek);
    const hours = calculateHours(rb.startTime, rb.endTime);
    const amountPerSession = rb.hourlyRate
      ? hours * rb.hourlyRate
      : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport);
    totalAmount += sessions * amountPerSession;
    totalHours += sessions * hours;
    bookingsCount += sessions;
  }

  return { totalAmount, totalHours, bookingsCount };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(
      searchParams.get("month") || String(new Date().getMonth() + 1),
    );
    const year = parseInt(
      searchParams.get("year") || String(new Date().getFullYear()),
    );
    const userId = searchParams.get("userId");

    if (userId) {
      return getDetailedBreakdown(userId, month, year);
    }

    const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE);
    const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE);

    const usersWithBookings = await prisma.user.findMany({
      where: {
        OR: [
          {
            bookings: {
              some: {
                bookingDate: { gte: startDate, lt: endDate },
                status: { not: "cancelled" },
              },
            },
          },
          {
            recurringBookings: {
              some: {
                isActive: true,
                startDate: { lte: endDate },
                OR: [{ endDate: null }, { endDate: { gte: startDate } }],
              },
            },
          },
          {
            lessonSessions: {
              some: {
                status: "completed",
                lessonDate: { gte: startDate, lt: endDate },
              },
            },
          },
        ],
      },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: startDate, lt: endDate },
            status: { not: "cancelled" },
          },
        },
        recurringBookings: {
          where: {
            isActive: true,
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
          include: { court: true },
        },
        monthlyPayments: {
          where: { month, year },
          include: { transactions: true },
        },
      },
    });

    const allUserIds = usersWithBookings.map((u) => u.id);
    const lessonBillingMap = await getLessonBillingForMonth(
      month,
      year,
      allUserIds,
    );

    const summaries = usersWithBookings.map((user) => {
      const bookingTotals = calculateBookingTotals(user, year, month);
      const lessonBilling = lessonBillingMap.get(user.id);
      const lessonAmount = lessonBilling?.totalAmount || 0;
      const lessonCount = lessonBilling?.lessonCount || 0;

      const totalAmount = bookingTotals.totalAmount + lessonAmount;
      const totalHours =
        bookingTotals.totalHours + (lessonBilling?.totalHours || 0);

      const monthlyPayment = user.monthlyPayments[0];
      const paidAmount = monthlyPayment?.paidAmount || 0;

      return {
        userId: user.id,
        uid: user.uid.toString().padStart(3, "0"),
        name: user.name,
        email: user.email,
        phone: user.phone,
        totalAmount,
        paidAmount,
        unpaidAmount: totalAmount - paidAmount,
        totalHours,
        bookingsCount: bookingTotals.bookingsCount,
        regularBookings: user.bookings.length,
        recurringBookings: bookingTotals.bookingsCount - user.bookings.length,
        lessonAmount,
        lessonCount,
        status:
          monthlyPayment?.status ||
          (totalAmount > 0 ? "unpaid" : "no-bookings"),
        paymentId: monthlyPayment?.id || null,
        transactions: monthlyPayment?.transactions || [],
      };
    });

    const filtered = summaries.filter((s) => s.totalAmount > 0);

    const statusOrder: Record<string, number> = {
      unpaid: 0,
      partial: 1,
      paid: 2,
    };
    filtered.sort((a, b) => {
      const aOrder = statusOrder[a.status] ?? 3;
      const bOrder = statusOrder[b.status] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.unpaidAmount - a.unpaidAmount;
    });

    const totals = {
      totalDue: filtered.reduce((sum, s) => sum + s.totalAmount, 0),
      totalPaid: filtered.reduce((sum, s) => sum + s.paidAmount, 0),
      totalUnpaid: filtered.reduce((sum, s) => sum + s.unpaidAmount, 0),
      usersCount: filtered.length,
      paidCount: filtered.filter((s) => s.status === "paid").length,
      partialCount: filtered.filter((s) => s.status === "partial").length,
      unpaidCount: filtered.filter((s) => s.status === "unpaid").length,
    };

    return NextResponse.json({ users: filtered, totals, month, year });
  } catch (error) {
    console.error("Error fetching monthly payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly payments" },
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

    const body = await request.json();
    const {
      userId,
      month,
      year,
      amount,
      paymentMethod,
      reference,
      notes,
      idempotencyKey,
    } = body;

    if (!userId || !month || !year || !amount || !paymentMethod) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: userId, month, year, amount, paymentMethod",
        },
        { status: 400 },
      );
    }

    if (idempotencyKey) {
      const existingTransaction = await prisma.paymentTransaction.findUnique({
        where: { idempotencyKey },
        include: { monthlyPayment: true },
      });
      if (existingTransaction) {
        return NextResponse.json({
          success: true,
          payment: existingTransaction.monthlyPayment,
          transaction: existingTransaction,
          duplicate: true,
        });
      }
    }

    const monthlyPayment = await prisma.monthlyPayment.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE);
    const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: startDate, lt: endDate },
            status: { not: "cancelled" },
          },
        },
        recurringBookings: {
          where: {
            isActive: true,
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
          include: { court: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bookingTotals = calculateBookingTotals(user, year, month);

    const lessonBillingMap = await getLessonBillingForMonth(month, year, [
      userId,
    ]);
    const lessonBilling = lessonBillingMap.get(userId);
    const totalAmount =
      bookingTotals.totalAmount + (lessonBilling?.totalAmount || 0);
    const totalHours =
      bookingTotals.totalHours + (lessonBilling?.totalHours || 0);
    const bookingsCount = bookingTotals.bookingsCount;

    const newPaidAmount = (monthlyPayment?.paidAmount || 0) + amount;
    const newStatus =
      newPaidAmount >= totalAmount
        ? "paid"
        : newPaidAmount > 0
          ? "partial"
          : "unpaid";

    const payment = await prisma.monthlyPayment.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: {
        userId,
        month,
        year,
        totalAmount,
        paidAmount: amount,
        bookingsCount,
        totalHours,
        status: newStatus,
        markedPaidBy: newStatus === "paid" ? session.user!.email : null,
        markedPaidAt: newStatus === "paid" ? new Date() : null,
      },
      update: {
        totalAmount,
        paidAmount: newPaidAmount,
        bookingsCount,
        totalHours,
        status: newStatus,
        markedPaidBy: newStatus === "paid" ? session.user!.email : undefined,
        markedPaidAt: newStatus === "paid" ? new Date() : undefined,
      },
    });

    const transaction = await prisma.paymentTransaction.create({
      data: {
        monthlyPaymentId: payment.id,
        amount,
        paymentMethod,
        reference,
        notes,
        recordedBy: session.user!.email!,
        idempotencyKey: idempotencyKey || undefined,
      },
    });

    return NextResponse.json({ success: true, payment, transaction });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
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
    const { userIds, month, year, paymentMethod, reference, notes } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds array required" },
        { status: 400 },
      );
    }
    if (!month || !year || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: month, year, paymentMethod" },
        { status: 400 },
      );
    }

    const lessonBillingMap = await getLessonBillingForMonth(
      month,
      year,
      userIds,
    );

    const results = [];
    const startDate = fromZonedTime(new Date(year, month - 1, 1), TIMEZONE);
    const endDate = fromZonedTime(new Date(year, month, 1), TIMEZONE);

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            bookings: {
              where: {
                bookingDate: { gte: startDate, lt: endDate },
                status: { not: "cancelled" },
              },
            },
            recurringBookings: {
              where: {
                isActive: true,
                startDate: { lte: endDate },
                OR: [{ endDate: null }, { endDate: { gte: startDate } }],
              },
              include: { court: true },
            },
            monthlyPayments: { where: { month, year } },
          },
        });

        if (!user) continue;

        const bookingTotals = calculateBookingTotals(user, year, month);
        const lessonBilling = lessonBillingMap.get(userId);
        const totalAmount =
          bookingTotals.totalAmount + (lessonBilling?.totalAmount || 0);
        const totalHours =
          bookingTotals.totalHours + (lessonBilling?.totalHours || 0);

        if (totalAmount === 0) continue;

        const existingPayment = user.monthlyPayments[0];
        const amountToPay = totalAmount - (existingPayment?.paidAmount || 0);
        if (amountToPay <= 0) continue;

        const payment = await prisma.monthlyPayment.upsert({
          where: { userId_month_year: { userId, month, year } },
          create: {
            userId,
            month,
            year,
            totalAmount,
            paidAmount: totalAmount,
            bookingsCount: bookingTotals.bookingsCount,
            totalHours,
            status: "paid",
            markedPaidBy: session.user!.email,
            markedPaidAt: new Date(),
          },
          update: {
            totalAmount,
            paidAmount: totalAmount,
            bookingsCount: bookingTotals.bookingsCount,
            totalHours,
            status: "paid",
            markedPaidBy: session.user!.email,
            markedPaidAt: new Date(),
          },
        });

        await prisma.paymentTransaction.create({
          data: {
            monthlyPaymentId: payment.id,
            amount: amountToPay,
            paymentMethod,
            reference,
            notes: notes || `Bulk payment for ${month}/${year}`,
            recordedBy: session.user!.email!,
          },
        });

        results.push({
          userId,
          name: user.name,
          amount: amountToPay,
          success: true,
        });
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
        results.push({ userId, success: false, error: "Processing failed" });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error bulk marking paid:", error);
    return NextResponse.json(
      { error: "Failed to bulk mark paid" },
      { status: 500 },
    );
  }
}
