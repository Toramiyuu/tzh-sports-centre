"use client";

import { useState } from "react";
import { CalendarDays, GraduationCap, Plus, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SlotTypeChooserProps {
  onSelectBooking: () => void;
  onSelectLesson: () => void;
  onSelectRecurringLesson: () => void;
}

export function SlotTypeChooser({
  onSelectBooking,
  onSelectLesson,
  onSelectRecurringLesson,
}: SlotTypeChooserProps) {
  const t = useTranslations("admin.bookings");
  const [open, setOpen] = useState(false);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-16 border-dashed border-border text-muted-foreground/70 hover:text-muted-foreground hover:bg-card"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <p className="text-xs text-muted-foreground mb-2 px-1">
          {t("chooseType")}
        </p>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 w-full"
            onClick={() => handleSelect(onSelectBooking)}
          >
            <CalendarDays className="w-4 h-4" />
            {t("addBooking")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 w-full"
            onClick={() => handleSelect(onSelectLesson)}
          >
            <GraduationCap className="w-4 h-4" />
            {t("addLesson")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 w-full"
            onClick={() => handleSelect(onSelectRecurringLesson)}
          >
            <Repeat className="w-4 h-4" />
            {t("addRecurringLesson")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
