"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import AbsencesReviewDialog from "./AbsencesReviewDialog";

interface AbsenceRecord {
  id: string;
  type: string;
  status: string;
  reason: string | null;
  proofUrl: string | null;
  lessonDate: string;
  appliedAt: string;
  user: { id: string; name: string; phone: string };
  lessonSession: { startTime: string; court: { name: string } };
  replacementCredit: { id: string; usedAt: string | null } | null;
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

export default function AbsencesContent() {
  const t = useTranslations("absence");
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewAbsence, setReviewAbsence] = useState<AbsenceRecord | null>(
    null,
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const res = await fetch("/api/admin/absences");
      const data = await res.json();
      if (res.ok) setAbsences(data.absences || []);
    } catch {
      toast.error(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (creditAwarded: boolean) => {
    if (!reviewAbsence) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/absences/${reviewAbsence.id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditAwarded, adminNotes }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(t("admin.reviewSuccess"));
        setReviewAbsence(null);
        setAdminNotes("");
        fetchAbsences();
      } else {
        toast.error(data.error || t("errors.submitFailed"));
      }
    } catch {
      toast.error(t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();
  const stats = useMemo(() => {
    const thisMonth = absences.filter((a) => {
      const d = new Date(a.lessonDate);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    const typeCounts: Record<string, number> = {};
    for (const a of thisMonth)
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    const byStudent: Record<string, { name: string; count: number }> = {};
    for (const a of thisMonth) {
      if (!byStudent[a.user.id])
        byStudent[a.user.id] = { name: a.user.name, count: 0 };
      byStudent[a.user.id].count++;
    }
    return {
      totalThisMonth: thisMonth.length,
      pendingCount: absences.filter((a) => a.status === "PENDING_REVIEW")
        .length,
      creditsAwarded: thisMonth.filter((a) => a.replacementCredit !== null)
        .length,
      topType:
        Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      studentRates: Object.values(byStudent).sort((a, b) => b.count - a.count),
    };
  }, [absences]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingReviews = useMemo(
    () => absences.filter((a) => a.status === "PENDING_REVIEW"),
    [absences],
  );
  const filtered = useMemo(
    () =>
      absences.filter(
        (a) =>
          (typeFilter === "all" || a.type === typeFilter) &&
          (statusFilter === "all" || a.status === statusFilter),
      ),
    [absences, typeFilter, statusFilter],
  );

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: t("admin.stats.totalThisMonth"),
            value: stats.totalThisMonth,
          },
          { label: t("admin.stats.pendingReviews"), value: stats.pendingCount },
          {
            label: t("admin.stats.creditsAwarded"),
            value: stats.creditsAwarded,
          },
          { label: t("admin.stats.mostCommonType"), value: stats.topType },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student absence rates */}
      {stats.studentRates.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t("admin.stats.perStudent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.studentRates.map((s) => (
                <span
                  key={s.name}
                  className="text-xs bg-muted px-2 py-1 rounded-full text-foreground"
                >
                  {s.name} — {s.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              {t("admin.pending.title")} ({pendingReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {a.user.name} · {a.user.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.lessonDate), "EEE dd MMM yyyy")} ·{" "}
                    {a.lessonSession.startTime} · {a.lessonSession.court.name}
                  </p>
                  {a.reason && (
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  )}
                  {a.proofUrl && (
                    <a
                      href={a.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t("admin.pending.viewProof")}
                    </a>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReviewAbsence(a);
                    setAdminNotes("");
                  }}
                >
                  {t("admin.pending.review")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Absences Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">
              {t("admin.table.title")}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.table.allTypes")}
                  </SelectItem>
                  {["APPLY", "LATE_NOTICE", "ABSENT", "MEDICAL"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`types.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.table.allStatuses")}
                  </SelectItem>
                  {["APPROVED", "RECORDED", "PENDING_REVIEW", "REVIEWED"].map(
                    (v) => (
                      <SelectItem key={v} value={v}>
                        {t(`statuses.${v}`)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("admin.table.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {a.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.lessonDate), "dd MMM yyyy")} ·{" "}
                      {a.lessonSession.court.name}
                    </p>
                    {a.reason && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {a.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AbsencesReviewDialog
        absence={reviewAbsence}
        adminNotes={adminNotes}
        submitting={submitting}
        onClose={() => setReviewAbsence(null)}
        onChangeNotes={setAdminNotes}
        onSubmit={submitReview}
      />
    </div>
  );
}
