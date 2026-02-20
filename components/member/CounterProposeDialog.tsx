"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minutes = i % 2 === 0 ? "00" : "30";
  const slotTime = `${hour.toString().padStart(2, "0")}:${minutes}`;
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = hour <= 12 ? hour : hour - 12;
  return { slotTime, displayName: `${displayHour}:${minutes} ${ampm}` };
});

interface CounterProposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialTime?: string;
  onSubmit: (dateTime: string) => Promise<void>;
  submitting: boolean;
}

export function CounterProposeDialog({
  open,
  onOpenChange,
  initialDate,
  initialTime,
  onSubmit,
  submitting,
}: CounterProposeDialogProps) {
  const t = useTranslations("member");
  const [counterDate, setCounterDate] = useState<Date | undefined>(initialDate);
  const [counterTime, setCounterTime] = useState(initialTime || "");

  const handleSubmit = async () => {
    if (!counterDate || !counterTime) return;
    const dateTime = `${format(counterDate, "yyyy-MM-dd")} ${counterTime}`;
    await onSubmit(dateTime);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-muted-foreground" />
            {t("counterPropose.title") || "Suggest Different Time"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("counterPropose.description") ||
              "Suggest an alternative date and time for your lesson."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-foreground">
              {t("counterPropose.date") || "Date"}
            </Label>
            <div className="border border-border rounded-xl p-3">
              <Calendar
                mode="single"
                selected={counterDate}
                onSelect={setCounterDate}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                className="mx-auto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">
              {t("counterPropose.time") || "Time"}
            </Label>
            <Select value={counterTime} onValueChange={setCounterTime}>
              <SelectTrigger className="border-border rounded-lg">
                <SelectValue
                  placeholder={t("counterPropose.selectTime") || "Select time"}
                />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.slotTime} value={slot.slotTime}>
                    {slot.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {counterDate && counterTime && (
            <div className="p-3 bg-secondary rounded-xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">
                {t("counterPropose.yourSuggestion") || "Your suggestion"}:
              </p>
              <p className="font-medium text-foreground">
                {format(counterDate, "EEEE, MMMM d, yyyy")} at{" "}
                {TIME_SLOTS.find((s) => s.slotTime === counterTime)
                  ?.displayName || counterTime}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            {t("dialog.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !counterDate || !counterTime}
            className="bg-foreground hover:bg-foreground/90 rounded-full"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("counterPropose.submit") || "Send Suggestion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
