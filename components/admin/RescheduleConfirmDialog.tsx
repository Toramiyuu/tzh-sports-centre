"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RescheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  fromCourtName: string;
  fromSlotTime: string;
  toCourtName: string;
  toSlotTime: string;
  onConfirm: () => void;
  loading: boolean;
}

export function RescheduleConfirmDialog({
  open,
  onOpenChange,
  itemName,
  fromCourtName,
  fromSlotTime,
  toCourtName,
  toSlotTime,
  onConfirm,
  loading,
}: RescheduleConfirmDialogProps) {
  const t = useTranslations("admin.bookings");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rescheduleTitle")}</DialogTitle>
          <DialogDescription>
            {itemName} — {t("rescheduleDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 text-center p-3 rounded-md bg-muted">
            <p className="text-xs text-muted-foreground mb-1">{t("from")}</p>
            <p className="font-medium text-sm">{fromCourtName}</p>
            <p className="text-sm text-muted-foreground">{fromSlotTime}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="flex-1 text-center p-3 rounded-md bg-primary/10 border border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">{t("to")}</p>
            <p className="font-medium text-sm">{toCourtName}</p>
            <p className="text-sm text-muted-foreground">{toSlotTime}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {t("confirmReschedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
