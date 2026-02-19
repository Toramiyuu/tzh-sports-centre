import { AbsenceType, AbsenceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MALAYSIA_TIMEZONE = "Asia/Kuala_Lumpur";

/**
 * Convert a Date to a YYYY-MM-DD string in Malaysia timezone (UTC+8).
 * Used for calendar-day comparisons that are timezone-aware.
 */
function toMalaysiaDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: MALAYSIA_TIMEZONE });
}

/**
 * Compute the number of whole calendar days between two dates in MYT timezone.
 * Uses YYYY-MM-DD string comparison to avoid UTC midnight boundary issues.
 */
function calendarDayDiff(from: Date, to: Date): number {
  const fromStr = toMalaysiaDateString(from);
  const toStr = toMalaysiaDateString(to);
  const fromMs = new Date(fromStr).getTime();
  const toMs = new Date(toStr).getTime();
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

/**
 * Classify an absence type based on how many calendar days (MYT) before the
 * lesson the absence is submitted.
 *
 * ≥ 7 days → APPLY (replacement credit awarded)
 * 3–6 days → LATE_NOTICE
 * < 3 days → ABSENT
 *
 * MEDICAL is set manually by the student via the isMedical flag — not returned here.
 */
export function classifyAbsence(
  appliedAt: Date,
  lessonDate: Date,
): AbsenceType {
  const days = calendarDayDiff(appliedAt, lessonDate);

  if (days >= 7) return AbsenceType.APPLY;
  if (days >= 3) return AbsenceType.LATE_NOTICE;
  return AbsenceType.ABSENT;
}

/**
 * Return the initial AbsenceStatus for a given AbsenceType.
 *
 * APPLY       → APPROVED   (credit granted automatically)
 * LATE_NOTICE → RECORDED   (noted but no credit)
 * ABSENT      → RECORDED   (noted but no credit)
 * MEDICAL     → PENDING_REVIEW (awaits admin review)
 */
export function getAbsenceStatus(type: AbsenceType): AbsenceStatus {
  switch (type) {
    case AbsenceType.APPLY:
      return AbsenceStatus.APPROVED;
    case AbsenceType.MEDICAL:
      return AbsenceStatus.PENDING_REVIEW;
    case AbsenceType.LATE_NOTICE:
    case AbsenceType.ABSENT:
    default:
      return AbsenceStatus.RECORDED;
  }
}

/**
 * Compute the expiry date for a replacement credit: 30 days from the given date.
 * Does not mutate the input.
 */
export function createReplacementCreditExpiry(fromDate: Date): Date {
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}

/**
 * Find replacement credits expiring within 3 days and create warning notifications
 * for each affected student who has not already been notified.
 * Called by the /api/cron/credit-expiry route.
 *
 * @returns count of notifications created
 */
export async function checkExpiringCredits(): Promise<number> {
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const expiringCredits = await prisma.replacementCredit.findMany({
    where: {
      usedAt: null,
      expiresAt: {
        gt: now,
        lte: threeDaysFromNow,
      },
    },
    include: {
      absence: {
        select: { lessonDate: true },
      },
    },
  });

  let notificationsCreated = 0;

  for (const credit of expiringCredits) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: credit.userId,
        type: "credit_expiring",
        message: { contains: credit.id },
      },
    });
    if (existing) continue;

    const lessonDate = credit.absence.lessonDate.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await prisma.notification.create({
      data: {
        userId: credit.userId,
        type: "credit_expiring",
        title: "Replacement Credit Expiring Soon",
        message: `Your replacement credit (from ${lessonDate} absence) expires in 3 days. Book a lesson to use it. [ref:${credit.id}]`,
        link: "/profile?tab=absences",
      },
    });

    notificationsCreated++;
  }

  return notificationsCreated;
}
