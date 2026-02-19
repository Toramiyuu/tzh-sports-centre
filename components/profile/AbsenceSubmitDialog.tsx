"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";

interface AbsenceSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLesson: {
    lessonDate: string;
    startTime: string;
  } | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  isMedical: boolean;
  onMedicalChange: (checked: boolean) => void;
  onProofFileChange: (file: File | null) => void;
  submitting: boolean;
  onSubmit: () => void;
  t: (key: string) => string;
}

export function AbsenceSubmitDialog({
  open,
  onOpenChange,
  selectedLesson,
  reason,
  onReasonChange,
  isMedical,
  onMedicalChange,
  onProofFileChange,
  submitting,
  onSubmit,
  t,
}: AbsenceSubmitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>
            {selectedLesson &&
              `${format(new Date(selectedLesson.lessonDate), "EEEE, dd MMM yyyy")} · ${selectedLesson.startTime}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="reason">{t("dialog.reason")}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t("dialog.reasonPlaceholder")}
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isMedical"
              checked={isMedical}
              onCheckedChange={(v) => onMedicalChange(!!v)}
            />
            <Label htmlFor="isMedical" className="cursor-pointer">
              {t("dialog.isMedical")}
            </Label>
          </div>
          {isMedical && (
            <div>
              <Label htmlFor="proof">{t("dialog.proof")}</Label>
              <input
                id="proof"
                type="file"
                accept="image/*"
                onChange={(e) => onProofFileChange(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {t("dialog.proofOptional")}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("dialog.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t("dialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
