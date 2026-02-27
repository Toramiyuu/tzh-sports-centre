"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarX2, Ticket, Loader2 } from "lucide-react";
import { ReplacementBookingSection } from "./ReplacementBookingSection";
import { UpcomingLessonsSection } from "./UpcomingLessonsSection";
import { toast } from "sonner";

interface LessonSession {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  court: { name: string };
}

interface AbsenceRecord {
  id: string;
  type: string;
  status: string;
  reason: string | null;
  lessonDate: string;
  appliedAt: string;
  lessonSession: { startTime: string; court: { name: string } };
  replacementCredit?: {
    id: string;
    usedAt: string | null;
    expiresAt: string;
  } | null;
}

interface ReplacementCredit {
  id: string;
  expiresAt: string;
  absence: { lessonDate: string; type: string };
}

const TYPE_COLOURS: Record<string, string> = {
  APPLY: "bg-green-500/20 text-green-700 dark:text-green-400",
  LATE_NOTICE: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  ABSENT: "bg-red-500/20 text-red-700 dark:text-red-400",
  MEDICAL: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
};

const STATUS_COLOURS: Record<string, string> = {
  APPROVED: "bg-green-500/20 text-green-700 dark:text-green-400",
  RECORDED: "bg-muted text-muted-foreground",
  PENDING_REVIEW: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  REVIEWED: "bg-primary/20 text-primary",
};

export function AbsencesTab() {
  const t = useTranslations("absence");
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [credits, setCredits] = useState<ReplacementCredit[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<LessonSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    try {
      const [absencesRes, creditsRes, lessonsRes] = await Promise.all([
        fetch("/api/absences"),
        fetch("/api/absences/credits"),
        fetch("/api/profile/lessons?upcoming=true"),
      ]);
      const [absData, credData, lessData] = await Promise.all([
        absencesRes.json(),
        creditsRes.json(),
        lessonsRes.json(),
      ]);
      if (absencesRes.ok) setAbsences(absData.absences || []);
      if (creditsRes.ok) setCredits(credData.credits || []);
      if (lessonsRes.ok) setUpcomingLessons(lessData.sessions || []);
    } catch {
      toast.error(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const todayDate = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const TYPE_PRIORITY: Record<string, number> = {
    MEDICAL: 4,
    ABSENT: 3,
    LATE_NOTICE: 2,
    APPLY: 1,
  };
  const absenceDateTypes = new Map<number, string>();
  absences
    .filter((a) => {
      const d = new Date(a.lessonDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .forEach((a) => {
      const day = new Date(a.lessonDate).getDate();
      const existing = absenceDateTypes.get(day);
      if (
        !existing ||
        (TYPE_PRIORITY[a.type] ?? 0) > (TYPE_PRIORITY[existing] ?? 0)
      ) {
        absenceDateTypes.set(day, a.type);
      }
    });

  const lessonDays = new Set<number>();
  upcomingLessons.forEach((l) => {
    const d = new Date(l.lessonDate);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      lessonDays.add(d.getDate());
    }
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const filteredLessons = selectedDate
    ? upcomingLessons.filter((l) => {
        const d = new Date(l.lessonDate);
        return (
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth &&
          d.getDate() === selectedDate
        );
      })
    : upcomingLessons;

  const handleDayClick = (day: number) => {
    const isFutureOrToday = day >= todayDate;
    const hasLesson = lessonDays.has(day);
    if (isFutureOrToday && hasLesson) {
      setSelectedDate(selectedDate === day ? null : day);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Replacement Credits */}
      {credits.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              {t("credits.title")} ({credits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {credits.map((c) => (
              <Badge
                key={c.id}
                className="bg-primary/10 text-primary border-0 text-sm py-1 px-3"
              >
                {t("credits.badge")} · {t("credits.expires")}{" "}
                {format(new Date(c.expiresAt), "dd MMM yyyy")}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <ReplacementBookingSection credits={credits} onRefresh={fetchAll} />

      {/* Calendar */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarX2 className="w-4 h-4" />
            {format(now, "MMMM yyyy")} · {t("calendar.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const hasLesson = lessonDays.has(day);
              const isFutureOrToday = day >= todayDate;
              const isClickable = hasLesson && isFutureOrToday;
              const isSelected = selectedDate === day;

              let dayClass =
                "h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm relative";

              if (isSelected) {
                dayClass +=
                  " bg-primary text-white font-semibold ring-2 ring-primary ring-offset-2 ring-offset-card";
              } else if (absenceDateTypes.has(day)) {
                dayClass += ` ${TYPE_COLOURS[absenceDateTypes.get(day)!] || ""} font-semibold`;
              } else if (day === todayDate) {
                dayClass += " bg-primary/20 text-primary font-semibold";
              } else {
                dayClass += " text-foreground";
              }

              if (isClickable && !isSelected) {
                dayClass += " cursor-pointer hover:bg-primary/10";
              }

              return (
                <div key={day} className="relative">
                  <div
                    className={dayClass}
                    onClick={
                      isClickable ? () => handleDayClick(day) : undefined
                    }
                  >
                    {day}
                  </div>
                  {hasLesson && !isSelected && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
          {selectedDate && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Showing lessons for{" "}
              {format(
                new Date(currentYear, currentMonth, selectedDate),
                "EEE, dd MMM",
              )}{" "}
              ·{" "}
              <button
                className="text-primary underline"
                onClick={() => setSelectedDate(null)}
              >
                Show all
              </button>
            </p>
          )}
        </CardContent>
      </Card>

      <UpcomingLessonsSection
        upcomingLessons={filteredLessons}
        onSubmitted={fetchAll}
      />

      {/* Absence History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {absences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("history.empty")}
            </p>
          ) : (
            absences.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(a.lessonDate), "EEE, dd MMM yyyy")} ·{" "}
                    {a.lessonSession?.court?.name}
                  </p>
                  {a.reason && (
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <Badge
                    className={`text-xs border-0 ${TYPE_COLOURS[a.type] || ""}`}
                  >
                    {t(`types.${a.type}`)}
                  </Badge>
                  <Badge
                    className={`text-xs border-0 ${STATUS_COLOURS[a.status] || ""}`}
                  >
                    {t(`statuses.${a.status}`)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
