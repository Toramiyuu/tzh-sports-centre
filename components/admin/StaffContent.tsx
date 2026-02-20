"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLessonTypes } from "@/lib/hooks/useLessonTypes";
import StaffTeachersTab, {
  type Teacher,
  type PayRate,
} from "./StaffTeachersTab";
import StaffPaySummaryTab, { type PaySummaryEntry } from "./StaffPaySummaryTab";

export default function StaffContent() {
  const t = useTranslations("admin.staff");
  const { lessonTypes } = useLessonTypes();
  const [activeTab, setActiveTab] = useState<"teachers" | "paySummary">(
    "teachers",
  );
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPayRates, setFormPayRates] = useState<PayRate[]>([]);

  const [paySummary, setPaySummary] = useState<PaySummaryEntry[]>([]);
  const [payMonth, setPayMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff?active=false");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaySummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/pay-summary?month=${payMonth}`);
      const data = await res.json();
      setPaySummary(data.summary || []);
    } catch (error) {
      console.error("Error fetching pay summary:", error);
    } finally {
      setLoading(false);
    }
  }, [payMonth]);

  useEffect(() => {
    if (activeTab === "teachers") fetchTeachers();
    else fetchPaySummary();
  }, [activeTab, fetchTeachers, fetchPaySummary]);

  const openAddDialog = () => {
    setEditingTeacher(null);
    setFormName("");
    setFormPhone("");
    setFormPayRates([]);
    setDialogOpen(true);
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormPhone(teacher.phone || "");
    setFormPayRates(
      teacher.payRates.map((pr) => ({
        lessonType: pr.lessonType,
        rate: pr.rate,
      })),
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      const body = {
        name: formName,
        phone: formPhone || null,
        payRates: formPayRates.filter((pr) => pr.lessonType && pr.rate > 0),
      };
      const url = editingTeacher
        ? `/api/admin/staff/${editingTeacher.id}`
        : "/api/admin/staff";
      const method = editingTeacher ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchTeachers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save teacher");
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (teacher: Teacher) => {
    if (teacher.isActive && !confirm(t("confirmDeactivate"))) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/staff/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !teacher.isActive }),
      });
      fetchTeachers();
    } catch (error) {
      console.error("Error toggling teacher:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const addPayRateRow = () => {
    setFormPayRates([...formPayRates, { lessonType: "", rate: 0 }]);
  };

  const removePayRateRow = (index: number) => {
    setFormPayRates(formPayRates.filter((_, i) => i !== index));
  };

  const updatePayRate = (
    index: number,
    field: "lessonType" | "rate",
    value: string | number,
  ) => {
    const updated = [...formPayRates];
    updated[index] = { ...updated[index], [field]: value };
    setFormPayRates(updated);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(search.toLowerCase()),
  );

  const tabs = [
    { key: "teachers" as const, label: t("tabs.teachers") },
    { key: "paySummary" as const, label: t("tabs.paySummary") },
  ];

  if (loading && teachers.length === 0 && paySummary.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "teachers" && (
        <StaffTeachersTab
          teachers={filteredTeachers}
          search={search}
          onSearchChange={setSearch}
          onAdd={openAddDialog}
          onEdit={openEditDialog}
          onToggleActive={handleToggleActive}
          onRefresh={fetchTeachers}
          loading={loading}
          actionLoading={actionLoading}
          t={t}
        />
      )}

      {activeTab === "paySummary" && (
        <StaffPaySummaryTab
          summary={paySummary}
          month={payMonth}
          onMonthChange={setPayMonth}
          onRefresh={fetchPaySummary}
          loading={loading}
          t={t}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? t("editTeacher") : t("addTeacher")}
            </DialogTitle>
            <DialogDescription>
              {editingTeacher
                ? `Editing ${editingTeacher.name}`
                : "Add a new teacher to the roster"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("teacherName")}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Coach Lee"
              />
            </div>
            <div>
              <Label>
                {t("phone")} ({t("optional")})
              </Label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. 0123456789"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("payRates")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPayRateRow}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t("addRate")}
                </Button>
              </div>
              {formPayRates.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("noRates")}</p>
              )}
              <div className="space-y-2">
                {formPayRates.map((pr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={pr.lessonType}
                      onValueChange={(v) => updatePayRate(idx, "lessonType", v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t("lessonType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {lessonTypes.map((lt) => (
                          <SelectItem key={lt.slug} value={lt.slug}>
                            {lt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={pr.rate || ""}
                      onChange={(e) =>
                        updatePayRate(idx, "rate", Number(e.target.value))
                      }
                      placeholder="RM"
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePayRateRow(idx)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || actionLoading}
            >
              {actionLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
