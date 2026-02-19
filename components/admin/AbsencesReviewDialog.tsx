"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface AbsenceRecord {
  id: string;
  reason: string | null;
  proofUrl: string | null;
  lessonDate: string;
  user: { name: string };
}

interface Props {
  absence: AbsenceRecord | null;
  adminNotes: string;
  submitting: boolean;
  onClose: () => void;
  onChangeNotes: (v: string) => void;
  onSubmit: (creditAwarded: boolean) => void;
}

export default function AbsencesReviewDialog({
  absence,
  adminNotes,
  submitting,
  onClose,
  onChangeNotes,
  onSubmit,
}: Props) {
  const t = useTranslations("absence");

  return (
    <Dialog open={!!absence} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.dialog.title")}</DialogTitle>
          <DialogDescription>
            {absence &&
              `${absence.user.name} · ${format(new Date(absence.lessonDate), "dd MMM yyyy")}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {absence?.reason && (
            <p className="text-sm text-muted-foreground">{absence.reason}</p>
          )}
          {absence?.proofUrl && (
            <a
              href={absence.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {t("admin.pending.viewProof")}
            </a>
          )}
          <div>
            <Label htmlFor="adminNotes">{t("admin.dialog.adminNotes")}</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder={t("admin.dialog.adminNotesPlaceholder")}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("dialog.cancel")}
          </Button>
          <Button
            variant="outline"
            className="border-red-500/50 text-red-600 hover:bg-red-500/10"
            onClick={() => onSubmit(false)}
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("admin.dialog.deny")}
          </Button>
          <Button onClick={() => onSubmit(true)} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("admin.dialog.approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
