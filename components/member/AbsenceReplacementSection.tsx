"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarX2 } from "lucide-react";
import { AbsenceSubmitDialog } from "@/components/profile/AbsenceSubmitDialog";
import { DashboardReplacementSection } from "./DashboardReplacementSection";
import { toast } from "sonner";

interface Lesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  court: { name: string };
}

interface AbsenceReplacementSectionProps {
  upcomingLessons: Lesson[];
  onRefresh: () => void;
}

export function AbsenceReplacementSection({
  upcomingLessons,
  onRefresh,
}: AbsenceReplacementSectionProps) {
  const ta = useTranslations("absence");
  const tm = useTranslations("member");

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [isMedical, setIsMedical] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const openAbsenceDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setReason("");
    setIsMedical(false);
    setProofFile(null);
    setAbsenceDialogOpen(true);
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
          toast.error(ta("errors.uploadFailed"));
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
        toast.success(ta("submitSuccess"));
        setAbsenceDialogOpen(false);
        onRefresh();
      } else {
        toast.error(data.error || ta("errors.submitFailed"));
      }
    } catch {
      toast.error(ta("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="mb-6 border border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <CalendarX2 className="w-5 h-5 text-muted-foreground" />
            {tm("absenceManagement.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DashboardReplacementSection onRefresh={onRefresh} />

          {/* Upcoming Lessons with Absence Buttons */}
          {upcomingLessons.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {tm("absenceManagement.requestAbsenceFor")}
              </p>
              {upcomingLessons.slice(0, 5).map((lesson) => {
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
                        {format(
                          new Date(lesson.lessonDate),
                          "EEE, dd MMM yyyy",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.startTime}–{lesson.endTime} ·{" "}
                        {lesson.court.name}
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
                      onClick={() => openAbsenceDialog(lesson)}
                    >
                      {isApply
                        ? ta("upcoming.applyButton")
                        : ta("upcoming.notifyButton")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state — no credits, no bookings, no lessons */}
          {upcomingLessons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tm("absenceManagement.noData")}
            </p>
          )}
        </CardContent>
      </Card>

      <AbsenceSubmitDialog
        open={absenceDialogOpen}
        onOpenChange={setAbsenceDialogOpen}
        selectedLesson={selectedLesson}
        reason={reason}
        onReasonChange={setReason}
        isMedical={isMedical}
        onMedicalChange={setIsMedical}
        onProofFileChange={setProofFile}
        submitting={submitting}
        onSubmit={submitAbsence}
        t={ta}
      />
    </>
  );
}
