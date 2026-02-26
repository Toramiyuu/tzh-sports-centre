"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLessonTypes } from "@/lib/hooks/useLessonTypes";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  return `${h.toString().padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
});

interface CreateRecurringLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: { id: number; name: string }[];
  members: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  onCreated: () => void;
}

export default function CreateRecurringLessonDialog({
  open,
  onOpenChange,
  courts,
  members,
  teachers,
  onCreated,
}: CreateRecurringLessonDialogProps) {
  const { lessonTypes, getLessonTypeBySlug, getDurationOptions } =
    useLessonTypes();

  const [saving, setSaving] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [lessonType, setLessonType] = useState("");
  const [duration, setDuration] = useState(1.5);
  const [courtId, setCourtId] = useState<number | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const selectedType = getLessonTypeBySlug(lessonType);
  const durationOptions = lessonType ? getDurationOptions(lessonType) : [];

  const toggleStudent = (id: string) =>
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const resetForm = () => {
    setDayOfWeek(1);
    setStartTime("09:00");
    setLessonType("");
    setDuration(1.5);
    setCourtId(null);
    setTeacherId("");
    setSelectedStudents([]);
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
  };

  const handleCreate = async () => {
    if (!courtId || !lessonType || selectedStudents.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/recurring-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          startTime,
          lessonType,
          duration,
          courtId,
          teacherId: teacherId || null,
          studentIds: selectedStudents,
          startDate,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        onOpenChange(false);
        resetForm();
        onCreated();
      }
    } catch (error) {
      console.error("Error creating recurring lesson:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Recurring Lesson</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Day of Week</Label>
              <Select
                value={dayOfWeek.toString()}
                onValueChange={(v) => setDayOfWeek(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lesson Type</Label>
              <Select value={lessonType} onValueChange={setLessonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {lessonTypes
                    .filter((lt) => lt.isActive)
                    .map((lt) => (
                      <SelectItem key={lt.slug} value={lt.slug}>
                        {lt.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.length > 0 ? (
                    durationOptions.map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        {d}hr
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="1.5">1.5hr</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Court</Label>
              <Select
                value={courtId?.toString() || ""}
                onValueChange={(v) => setCourtId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher (optional)</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>
              Students {selectedType && `(max ${selectedType.maxStudents})`}
            </Label>
            <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
              {members.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(m.id)}
                    onChange={() => toggleStudent(m.id)}
                    disabled={
                      !selectedStudents.includes(m.id) &&
                      selectedType !== null &&
                      selectedStudents.length >=
                        (selectedType?.maxStudents || 99)
                    }
                  />
                  <span className="text-sm">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on footwork"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              saving || !courtId || !lessonType || selectedStudents.length === 0
            }
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
