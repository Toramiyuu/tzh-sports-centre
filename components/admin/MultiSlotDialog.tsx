"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, GraduationCap, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface SlotInfo {
  courtId: number;
  slotTime: string;
  courtName: string;
  displayTime: string;
}

interface LessonTypeOption {
  slug: string;
  name: string;
  maxStudents: number;
}

interface StudentOption {
  id: string;
  name: string;
  uid: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface MultiSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "booking" | "lesson";
  slots: SlotInfo[];
  loading: boolean;
  onCreate: (
    type: "booking" | "lesson",
    formData: Record<string, unknown>,
  ) => Promise<void>;
}

export function MultiSlotDialog({
  open,
  onOpenChange,
  type,
  slots,
  loading,
  onCreate,
}: MultiSlotDialogProps) {
  const t = useTranslations("admin.bookings");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sport, setSport] = useState<"badminton" | "pickleball">("badminton");

  const [lessonTypes, setLessonTypes] = useState<LessonTypeOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [lessonType, setLessonType] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [fetchingData, setFetchingData] = useState(false);
  const [lastFetchedOpen, setLastFetchedOpen] = useState(false);

  if (open && type === "lesson" && !lastFetchedOpen) {
    setLastFetchedOpen(true);
    setFetchingData(true);
    Promise.all([
      fetch("/api/admin/lesson-types").then((r) => r.json()),
      fetch("/api/admin/trainees").then((r) => r.json()),
      fetch("/api/admin/teachers").then((r) => r.json()),
    ])
      .then(([typesData, studentsData, teachersData]) => {
        setLessonTypes(
          (typesData || []).filter(
            (lt: LessonTypeOption & { isActive?: boolean }) =>
              lt.isActive !== false,
          ),
        );
        setStudents(studentsData?.trainees || studentsData || []);
        setTeachers(teachersData?.teachers || teachersData || []);
      })
      .catch(console.error)
      .finally(() => setFetchingData(false));
  }
  if (!open && lastFetchedOpen) {
    setLastFetchedOpen(false);
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setPhone("");
      setSport("badminton");
      setLessonType("");
      setSelectedStudentIds([]);
      setTeacherId("");
    }
    onOpenChange(nextOpen);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectedLessonType = lessonTypes.find((lt) => lt.slug === lessonType);
  const maxStudents = selectedLessonType?.maxStudents || 999;

  const isValid =
    type === "booking"
      ? name.trim() !== "" && phone.trim() !== ""
      : lessonType !== "" && selectedStudentIds.length > 0;

  const handleSubmit = () => {
    if (type === "booking") {
      onCreate("booking", { name, phone, sport });
    } else {
      onCreate("lesson", {
        lessonType,
        duration: 0.5,
        studentIds: selectedStudentIds,
        teacherId: teacherId || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "booking" ? (
              <Plus className="w-5 h-5" />
            ) : (
              <GraduationCap className="w-5 h-5" />
            )}
            {type === "booking" ? t("createBookings") : t("createLesson")}
          </DialogTitle>
          <DialogDescription>
            {slots.length} {t("freeSlots")} {t("selected").toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        {/* Selected slots summary */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {slots.map((s) => (
            <Badge
              key={`${s.courtId}-${s.slotTime}`}
              variant="outline"
              className="text-xs"
            >
              {s.courtName} @ {s.displayTime}
            </Badge>
          ))}
        </div>

        <div className="space-y-4 py-2">
          {type === "booking" ? (
            <>
              <div>
                <Label>{t("name")} *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("customerName")}
                />
              </div>
              <div>
                <Label>{t("phone")} *</Label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>
              <div>
                <Label>{t("sport")}</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={sport === "badminton" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSport("badminton")}
                  >
                    {t("badmintonPrice")}
                  </Button>
                  <Button
                    variant={sport === "pickleball" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSport("pickleball")}
                  >
                    {t("pickleballPrice")}
                  </Button>
                </div>
              </div>
            </>
          ) : fetchingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <Label>Lesson Type *</Label>
                <Select value={lessonType} onValueChange={setLessonType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypes.map((lt) => (
                      <SelectItem key={lt.slug} value={lt.slug}>
                        {lt.name} (max {lt.maxStudents})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Students * ({selectedStudentIds.length}
                  {selectedLessonType && `/${maxStudents}`})
                </Label>
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto border border-border rounded-md p-2">
                  {students.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No trainees found
                    </p>
                  ) : (
                    students.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      const atMax =
                        selectedStudentIds.length >= maxStudents && !isSelected;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={atMax}
                          onClick={() => toggleStudent(s.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                            isSelected
                              ? "bg-primary text-white"
                              : atMax
                                ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                                : "bg-secondary text-foreground hover:bg-primary/20"
                          }`}
                        >
                          {s.name}
                          {isSelected && <X className="w-3 h-3" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {teachers.length > 0 && (
                <div>
                  <Label>Teacher (optional)</Label>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : type === "booking" ? (
              <Plus className="w-4 h-4 mr-2" />
            ) : (
              <GraduationCap className="w-4 h-4 mr-2" />
            )}
            {type === "booking"
              ? `${t("createBookings")} (${slots.length})`
              : `${t("createLesson")} (${slots.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
