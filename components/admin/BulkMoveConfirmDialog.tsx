"use client";

import { ArrowRight, Loader2, Move } from "lucide-react";
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

interface BulkMoveAssignment {
  id: string;
  type: "booking" | "lesson";
  name: string;
  fromCourtName: string;
  fromSlotTime: string;
  toCourtName: string;
  toSlotTime: string;
}

interface BulkMoveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: BulkMoveAssignment[];
  onConfirm: () => void;
  loading: boolean;
}

export function BulkMoveConfirmDialog({
  open,
  onOpenChange,
  assignments,
  onConfirm,
  loading,
}: BulkMoveConfirmDialogProps) {
  const t = useTranslations("admin.bookings");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            {t("bulkMoveConfirmTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("bulkMoveConfirmDescription", { count: assignments.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-2 py-2">
          {assignments.map((a, i) => (
            <div
              key={`${a.id}-${i}`}
              className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.fromCourtName} · {a.fromSlotTime}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs text-primary font-medium">
                  {a.toCourtName}
                </p>
                <p className="text-xs text-muted-foreground">{a.toSlotTime}</p>
              </div>
            </div>
          ))}
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
              <Move className="w-4 h-4 mr-2" />
            )}
            {t("bulkMoveConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
