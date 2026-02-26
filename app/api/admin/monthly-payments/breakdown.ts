import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";
import {
  calculateHours,
  calculateBookingAmount,
} from "@/lib/recurring-booking-utils";
import { getLessonBillingForMonth } from "@/lib/lesson-billing-utils";

const TIMEZONE = "Asia/Kuala_Lumpur";

export async function getDetailedBreakdown(
  userId: string,
  month: number,
  year: number,
) {
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
        include: { court: true },
        orderBy: { bookingDate: "asc" },
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

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const breakdown: Array<{
    type: "booking" | "recurring" | "lesson";
    date: string;
    court: string;
    sport: string;
    time: string;
    hours: number;
    rate: number;
    amount: number;
    bookingId?: string;
    recurringId?: string;
    lessonSessionId?: string;
    billingType?: string;
    attended?: boolean;
  }> = [];

  for (const booking of user.bookings) {
    const hours = calculateHours(booking.startTime, booking.endTime);
    breakdown.push({
      type: "booking",
      date: booking.bookingDate.toISOString().split("T")[0],
      court: booking.court.name,
      sport: booking.sport,
      time: `${booking.startTime} - ${booking.endTime}`,
      hours,
      rate: booking.totalAmount / hours,
      amount: booking.totalAmount,
      bookingId: booking.id,
    });
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  for (const rb of user.recurringBookings) {
    const hours = calculateHours(rb.startTime, rb.endTime);
    const amount = rb.hourlyRate
      ? hours * rb.hourlyRate
      : calculateBookingAmount(rb.startTime, rb.endTime, rb.sport);
    const effectiveRate = amount / hours;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === rb.dayOfWeek) {
        breakdown.push({
          type: "recurring",
          date: date.toISOString().split("T")[0],
          court: rb.court.name,
          sport: rb.sport,
          time: `${rb.startTime} - ${rb.endTime}`,
          hours,
          rate: effectiveRate,
          amount,
          recurringId: rb.id,
        });
      }
    }
  }

  const lessonBillingMap = await getLessonBillingForMonth(month, year, [
    userId,
  ]);
  const lessonBilling = lessonBillingMap.get(userId);
  if (lessonBilling) {
    for (const item of lessonBilling.items) {
      breakdown.push({
        type: "lesson",
        date: item.lessonDate,
        court: item.court,
        sport: item.lessonType,
        time: `${item.startTime} - ${item.endTime}`,
        hours: item.duration,
        rate: item.pricePerStudent / item.duration,
        amount: item.amount,
        lessonSessionId: item.lessonSessionId,
        billingType: item.billingType,
        attended: item.attended,
      });
    }
  }

  breakdown.sort((a, b) => a.date.localeCompare(b.date));

  const totalAmount = breakdown.reduce((sum, b) => sum + b.amount, 0);
  const totalHours = breakdown.reduce((sum, b) => sum + b.hours, 0);
  const monthlyPayment = user.monthlyPayments[0];

  return NextResponse.json({
    user: {
      id: user.id,
      uid: user.uid.toString().padStart(3, "0"),
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    breakdown,
    summary: {
      totalAmount,
      paidAmount: monthlyPayment?.paidAmount || 0,
      unpaidAmount: totalAmount - (monthlyPayment?.paidAmount || 0),
      totalHours,
      bookingsCount: breakdown.length,
      status: monthlyPayment?.status || "unpaid",
    },
    transactions: monthlyPayment?.transactions || [],
    month,
    year,
  });
}
