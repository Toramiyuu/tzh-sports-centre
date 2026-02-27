"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Plus, Pencil, RefreshCw, Users } from "lucide-react";

export interface PayRate {
  id?: string;
  lessonType: string;
  rate: number;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string | null;
  userId: string | null;
  role: "TEACHER" | "COACH_ASSISTANT";
  hourlyRate: number;
  isActive: boolean;
  payRates: PayRate[];
  user: { id: string; name: string; email: string } | null;
}

interface TeachersTabProps {
  teachers: Teacher[];
  search: string;
  onSearchChange: (s: string) => void;
  onAdd: () => void;
  onEdit: (t: Teacher) => void;
  onToggleActive: (t: Teacher) => void;
  onRefresh: () => void;
  loading: boolean;
  actionLoading: boolean;
  t: (key: string) => string;
}

export default function StaffTeachersTab({
  teachers,
  search,
  onSearchChange,
  onAdd,
  onEdit,
  onToggleActive,
  onRefresh,
  loading,
  actionLoading,
  t,
}: TeachersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={t("searchTeachers")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            {t("addTeacher")}
          </Button>
        </div>
      </div>

      {teachers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t("noTeachers")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{teacher.name}</CardTitle>
                    {teacher.phone && (
                      <p className="text-sm text-muted-foreground">
                        {teacher.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={
                        teacher.role === "COACH_ASSISTANT"
                          ? "text-xs bg-purple-50 text-purple-700 border-purple-300"
                          : "text-xs bg-blue-50 text-blue-700 border-blue-300"
                      }
                    >
                      {teacher.role === "COACH_ASSISTANT" ? (
                        <Users className="w-3 h-3 mr-1" />
                      ) : (
                        <GraduationCap className="w-3 h-3 mr-1" />
                      )}
                      {teacher.role === "COACH_ASSISTANT"
                        ? t("coachAssistant")
                        : t("teacher")}
                    </Badge>
                    <Badge variant={teacher.isActive ? "default" : "secondary"}>
                      {teacher.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {teacher.hourlyRate > 0 && (
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs">
                      RM{teacher.hourlyRate}/hr
                    </Badge>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(teacher)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleActive(teacher)}
                    disabled={actionLoading}
                  >
                    {teacher.isActive ? t("inactive") : t("active")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
