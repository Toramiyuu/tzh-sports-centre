"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, Clock, AlertCircle } from "lucide-react";

interface Student {
  id: string;
  name: string;
  phone?: string;
}

interface AttendanceRecord {
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
}

interface ExistingAttendance {
  id: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  user: { id: string; name: string };
}

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string | null;
  lessonLabel: string;
  onSaved: () => void;
}

const STATUS_OPTIONS: {
  value: AttendanceRecord["status"];
  label: string;
  icon: typeof UserCheck;
  color: string;
}[] = [
  {
    value: "PRESENT",
    label: "Present",
    icon: UserCheck,
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    value: "LATE",
    label: "Late",
    icon: Clock,
    color: "bg-yellow-600 hover:bg-yellow-700",
  },
  {
    value: "ABSENT",
    label: "Absent",
    icon: UserX,
    color: "bg-red-600 hover:bg-red-700",
  },
  {
    value: "EXCUSED",
    label: "Excused",
    icon: AlertCircle,
    color: "bg-blue-600 hover:bg-blue-700",
  },
];

export default function AttendanceDialog({
  open,
  onOpenChange,
  lessonId,
  lessonLabel,
  onSaved,
}: AttendanceDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<
    Record<string, AttendanceRecord["status"]>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/attendance`);
      const data = await res.json();
      setStudents(data.students || []);

      const existing: Record<string, AttendanceRecord["status"]> = {};
      (data.attendances || []).forEach((a: ExistingAttendance) => {
        existing[a.userId] = a.status;
      });
      (data.students || []).forEach((s: Student) => {
        if (!existing[s.id]) {
          existing[s.id] = "PRESENT";
        }
      });
      setRecords(existing);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (open && lessonId) {
      fetchAttendance();
    }
  }, [open, lessonId, fetchAttendance]);

  const handleSave = async () => {
    if (!lessonId) return;
    setSaving(true);
    try {
      const attendanceRecords = Object.entries(records).map(
        ([userId, status]) => ({
          userId,
          status,
        }),
      );

      const res = await fetch(`/api/admin/lessons/${lessonId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: attendanceRecords }),
      });

      if (res.ok) {
        onSaved();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = (userId: string, status: AttendanceRecord["status"]) => {
    setRecords((prev) => ({ ...prev, [userId]: status }));
  };

  const presentCount = Object.values(records).filter(
    (s) => s === "PRESENT" || s === "LATE",
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <p className="text-sm text-muted-foreground">{lessonLabel}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {students.map((student) => {
              const currentStatus = records[student.id] || "PRESENT";
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
                >
                  <div>
                    <div className="font-medium text-sm">{student.name}</div>
                    {student.phone && (
                      <div className="text-xs text-muted-foreground">
                        {student.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = currentStatus === opt.value;
                      return (
                        <Button
                          key={opt.value}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className={`h-8 px-2 ${isActive ? `${opt.color} text-white` : ""}`}
                          onClick={() => setStatus(student.id, opt.value)}
                          title={opt.label}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline">
            {presentCount}/{students.length} attending
          </Badge>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
