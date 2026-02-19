"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AbsenceSubmitDialog } from "./AbsenceSubmitDialog";
import { toast } from "sonner";

interface LessonSession {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  court: { name: string };
}

interface Props {
  upcomingLessons: LessonSession[];
  onSubmitted: () => void;
}

export function UpcomingLessonsSection({
  upcomingLessons,
  onSubmitted,
}: Props) {
  const t = useTranslations("absence");
  const [selectedLesson, setSelectedLesson] = useState<LessonSession | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [isMedical, setIsMedical] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

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
        onSubmitted();
      } else {
        toast.error(data.error || t("errors.submitFailed"));
      }
    } catch {
      toast.error(t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
    </>
  );
}
