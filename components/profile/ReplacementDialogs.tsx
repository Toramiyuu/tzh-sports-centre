"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ReplacementCredit {
  id: string;
  expiresAt: string;
  absence: { lessonDate: string; type: string };
}

interface AvailableSession {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  court: { name: string };
}

interface MyBooking {
  id: string;
  lessonSession: {
    id: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    court: { name: string };
  };
}

interface BookingConfirmDialogProps {
  session: AvailableSession | null;
  onClose: () => void;
  credits: ReplacementCredit[];
  selectedCreditId: string;
  onCreditChange: (id: string) => void;
  booking: boolean;
  onConfirm: () => void;
}

export function BookingConfirmDialog({
  session,
  onClose,
  credits,
  selectedCreditId,
  onCreditChange,
  booking,
  onConfirm,
}: BookingConfirmDialogProps) {
  const t = useTranslations("replacement");

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>{t("confirmMessage")}</DialogDescription>
        </DialogHeader>
        {session && (
          <div className="space-y-3 py-2">
            <p className="text-sm">
              <span className="font-medium">
                {format(new Date(session.lessonDate), "EEE, dd MMM yyyy")}
              </span>{" "}
              · {session.startTime}–{session.endTime} · {session.court.name}
            </p>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t("creditToUse")}
              </p>
              <select
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
                value={selectedCreditId}
                onChange={(e) => onCreditChange(e.target.value)}
              >
                {credits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t("expiresOn", {
                      date: format(new Date(c.expiresAt), "dd MMM yyyy"),
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={booking}>
            {t("cancelConfirm").split("?")[0]}
          </Button>
          <Button onClick={onConfirm} disabled={booking}>
            {booking && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("bookButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CancelConfirmDialogProps {
  booking: MyBooking | null;
  onClose: () => void;
  cancelling: boolean;
  onConfirm: () => void;
  isForfeit: boolean;
}

export function CancelConfirmDialog({
  booking,
  onClose,
  cancelling,
  onConfirm,
  isForfeit,
}: CancelConfirmDialogProps) {
  const t = useTranslations("replacement");

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancelConfirm")}</DialogTitle>
          <DialogDescription>
            {isForfeit ? t("cancelWarningForfeit") : t("cancelWarningReturn")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cancelling}>
            {t("cancelConfirm").split("?")[0].trim()}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={cancelling}
          >
            {cancelling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("cancelConfirm").replace("?", "")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
