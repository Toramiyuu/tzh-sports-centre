"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarX2, Ticket, Loader2 } from "lucide-react";
import { AbsenceSubmitDialog } from "./AbsenceSubmitDialog";
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
  const [selectedLesson, setSelectedLesson] = useState<LessonSession | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [isMedical, setIsMedical] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAll();
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
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
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

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getDay();

  const openDialog = (lesson: LessonSession) => {
    setSelectedLesson(lesson);
    setReason("");
    setIsMedical(false);
    setProofFile(null);
    setDialogOpen(true);
  };

  const submitAbsence = async () => {
    if (!selectedLesson) return;
    setSubmitting(true);
    try {
      let proofUrl: string | undefined;
      if (isMedical && proofFile) {
        const fd = new FormData();
        fd.append("file", proofFile);
        const uploadRes = await fetch("/api/upload/absence-proof", {
          method: "POST",
          body: fd,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          proofUrl = uploadData.url;
        } else {
          toast.error(t("errors.uploadFailed"));
        }
      }

      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonSessionId: selectedLesson.id,
          reason,
          isMedical,
          proofUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("submitSuccess"));
        setDialogOpen(false);
        fetchAll();
      } else {
        toast.error(data.error || t("errors.submitFailed"));
      }
    } catch {
      toast.error(t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
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
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm ${
                  absenceDateTypes.has(day)
                    ? `${TYPE_COLOURS[absenceDateTypes.get(day)!] || ""} font-semibold`
                    : day === now.getDate()
                      ? "bg-primary/20 text-primary font-semibold"
                      : "text-foreground"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Lessons */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("upcoming.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("upcoming.empty")}
            </p>
          ) : (
            upcomingLessons.map((lesson) => {
              const daysUntil = Math.floor(
                (new Date(lesson.lessonDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              );
              const isApply = daysUntil >= 7;
              return (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(lesson.lessonDate), "EEE, dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lesson.startTime}–{lesson.endTime} · {lesson.court.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={
                      isApply
                        ? "border-green-500 text-green-700 dark:text-green-400"
                        : "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                    }
                    onClick={() => openDialog(lesson)}
                  >
                    {isApply
                      ? t("upcoming.applyButton")
                      : t("upcoming.notifyButton")}
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

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

      {/* Submit Absence Dialog */}
      <AbsenceSubmitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedLesson={selectedLesson}
        reason={reason}
        onReasonChange={setReason}
        isMedical={isMedical}
        onMedicalChange={setIsMedical}
        onProofFileChange={setProofFile}
        submitting={submitting}
        onSubmit={submitAbsence}
        t={t}
      />
    </div>
  );
}
