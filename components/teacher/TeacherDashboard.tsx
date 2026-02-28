"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import AttendanceDialog from "@/components/admin/AttendanceDialog";
import { useLessonTypes } from "@/lib/hooks/useLessonTypes";

interface Student {
  id: string;
  name: string;
  phone: string;
  skillLevel: string | null;
}

interface Attendance {
  userId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
}

interface Lesson {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  lessonType: string;
  duration: number;
  price: number;
  status: string;
  notes: string | null;
  court: { id: number; name: string };
  students: Student[];
  attendances: Attendance[];
}

export default function TeacherDashboard() {
  const { getLessonTypeBySlug } = useLessonTypes();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceLessonId, setAttendanceLessonId] = useState("");
  const [attendanceLessonLabel, setAttendanceLessonLabel] = useState("");

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 1,
  });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 1,
  });

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), {
        weekStartsOn: 1,
      });
      const weekEnd = endOfWeek(addWeeks(new Date(), weekOffset), {
        weekStartsOn: 1,
      });
      const from = format(weekStart, "yyyy-MM-dd");
      const to = format(weekEnd, "yyyy-MM-dd");
      const res = await fetch(`/api/teacher/lessons?from=${from}&to=${to}`);
      if (res.status === 403) {
        setError("not_teacher");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTeacher(data.teacher);
      setLessons(data.lessons || []);
    } catch {
      setError("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const openAttendance = (lesson: Lesson) => {
    const typeInfo = getLessonTypeBySlug(lesson.lessonType);
    setAttendanceLessonId(lesson.id);
    setAttendanceLessonLabel(
      `${typeInfo?.name || lesson.lessonType} — ${lesson.startTime}-${lesson.endTime}`,
    );
    setAttendanceDialogOpen(true);
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const groupedByDay = lessons.reduce(
    (acc, lesson) => {
      const dateKey = format(new Date(lesson.lessonDate), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(lesson);
      return acc;
    },
    {} as Record<string, Lesson[]>,
  );

  const sortedDays = Object.keys(groupedByDay).sort();

  if (error === "not_teacher") {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Not a Teacher Account</h1>
        <p className="text-muted-foreground">
          Your account is not linked to a teacher profile. Contact an admin.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          {teacher && (
            <p className="text-muted-foreground">Welcome, {teacher.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((w) => w + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {format(currentWeekStart, "MMM d")} –{" "}
        {format(currentWeekEnd, "MMM d, yyyy")}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : sortedDays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No lessons scheduled for this week
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((dateKey) => {
            const dayLessons = groupedByDay[dateKey];
            const isToday = dateKey === todayStr;
            return (
              <div key={dateKey}>
                <h3
                  className={`text-sm font-semibold mb-2 ${isToday ? "text-primary" : "text-muted-foreground"}`}
                >
                  {format(new Date(dateKey), "EEEE, MMM d")}
                  {isToday && " (Today)"}
                </h3>
                <div className="grid gap-3">
                  {dayLessons.map((lesson) => {
                    const typeInfo = getLessonTypeBySlug(lesson.lessonType);
                    const hasAttendance = lesson.attendances.length > 0;
                    const allMarked =
                      lesson.attendances.length === lesson.students.length;
                    return (
                      <Card key={lesson.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {typeInfo?.name || lesson.lessonType}
                                </span>
                                <Badge variant="outline">
                                  {lesson.court.name}
                                </Badge>
                                <Badge
                                  variant={
                                    lesson.status === "completed"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {lesson.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.startTime} - {lesson.endTime} (
                                  {lesson.duration}hr)
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {lesson.students
                                    .map((s) => s.name)
                                    .join(", ")}
                                </span>
                              </div>
                              {lesson.notes && (
                                <p className="text-xs text-muted-foreground italic">
                                  {lesson.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {hasAttendance && (
                                <span className="text-xs text-muted-foreground">
                                  {allMarked ? (
                                    <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                  ) : (
                                    `${lesson.attendances.length}/${lesson.students.length}`
                                  )}
                                </span>
                              )}
                              {lesson.status === "scheduled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAttendance(lesson)}
                                >
                                  Attendance
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Week Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{lessons.length}</div>
              <div className="text-xs text-muted-foreground">Total Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {
                  new Set(lessons.flatMap((l) => l.students.map((s) => s.id)))
                    .size
                }
              </div>
              <div className="text-xs text-muted-foreground">Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {lessons.reduce((sum, l) => sum + l.duration, 0)}h
              </div>
              <div className="text-xs text-muted-foreground">
                Teaching Hours
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        lessonId={attendanceLessonId}
        lessonLabel={attendanceLessonLabel}
        onSaved={fetchLessons}
      />
    </div>
  );
}
