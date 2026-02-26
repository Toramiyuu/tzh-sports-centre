"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Repeat,
  Calendar,
  Users,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import { useLessonTypes } from "@/lib/hooks/useLessonTypes";
import CreateRecurringLessonDialog from "./CreateRecurringLessonDialog";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface RecurringLesson {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  lessonType: string;
  duration: number;
  price: number;
  courtId: number;
  court: { id: number; name: string };
  teacher: { id: string; name: string } | null;
  studentIds: string[];
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

interface RecurringLessonsPanelProps {
  courts: { id: number; name: string }[];
  members: { id: string; name: string }[];
  teachers?: { id: string; name: string }[];
}

export default function RecurringLessonsPanel({
  courts,
  members,
  teachers = [],
}: RecurringLessonsPanelProps) {
  const { getLessonTypeBySlug, isMonthlyBilling } = useLessonTypes();

  const [recurringLessons, setRecurringLessons] = useState<RecurringLesson[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRecurringLessons = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/recurring-lessons?active=false");
      const data = await res.json();
      setRecurringLessons(data.recurringLessons || []);
    } catch (error) {
      console.error("Error fetching recurring lessons:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringLessons();
  }, [fetchRecurringLessons]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setActionLoading(true);
    try {
      await fetch("/api/admin/recurring-lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      fetchRecurringLessons();
    } catch (error) {
      console.error("Error toggling recurring lesson:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/recurring-lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeksAhead: 4 }),
      });
      const data = await res.json();
      alert(
        `Generated ${data.generated} lesson(s), skipped ${data.skipped} (conflicts/existing)`,
      );
    } catch (error) {
      console.error("Error generating lessons:", error);
    } finally {
      setGenerating(false);
    }
  };

  const getMemberNames = (ids: string[]) =>
    ids
      .map((id) => members.find((m) => m.id === id)?.name || "Unknown")
      .join(", ");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Recurring Lessons
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Generate Next 4 Weeks
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring
          </Button>
        </div>
      </div>

      {recurringLessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No recurring lessons set up yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {recurringLessons.map((rl) => {
            const typeInfo = getLessonTypeBySlug(rl.lessonType);
            return (
              <Card key={rl.id} className={rl.isActive ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {typeInfo?.name || rl.lessonType}
                        </span>
                        <Badge variant="outline">{DAYS[rl.dayOfWeek]}</Badge>
                        <Badge variant="outline">{rl.court.name}</Badge>
                        {!rl.isActive && (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                        {isMonthlyBilling(rl.lessonType) && (
                          <Badge className="bg-blue-600">Monthly</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rl.startTime} - {rl.endTime} ({rl.duration}hr)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {getMemberNames(rl.studentIds)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rl.teacher && `${rl.teacher.name} • `}
                        From {format(new Date(rl.startDate), "dd MMM yyyy")}
                        {rl.endDate &&
                          ` to ${format(new Date(rl.endDate), "dd MMM yyyy")}`}
                        {" • "}RM{rl.price}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(rl.id, rl.isActive)}
                      disabled={actionLoading}
                    >
                      {rl.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateRecurringLessonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courts={courts}
        members={members}
        teachers={teachers}
        onCreated={fetchRecurringLessons}
      />
    </div>
  );
}
