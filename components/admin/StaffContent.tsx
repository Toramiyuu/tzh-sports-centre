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
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import StaffTeachersTab, { type Teacher } from "./StaffTeachersTab";
import StaffPaySummaryTab, { type PaySummaryEntry } from "./StaffPaySummaryTab";

export default function StaffContent() {
  const t = useTranslations("admin.staff");
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
  const [formRole, setFormRole] = useState<"TEACHER" | "COACH_ASSISTANT">(
    "TEACHER",
  );
  const [formHourlyRate, setFormHourlyRate] = useState<number>(0);
  const [formUid, setFormUid] = useState("");
  const [formLinkedUser, setFormLinkedUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

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
    setFormRole("TEACHER");
    setFormHourlyRate(0);
    setFormUid("");
    setFormLinkedUser(null);
    setDialogOpen(true);
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormPhone(teacher.phone || "");
    setFormRole(teacher.role || "TEACHER");
    setFormHourlyRate(teacher.hourlyRate || 0);
    setFormUid("");
    setFormLinkedUser(teacher.user || null);
    setDialogOpen(true);
  };

  const searchUserByUid = async () => {
    if (!formUid.trim()) return;
    setUserSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts?uid=${formUid.trim()}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setFormLinkedUser(data.user);
        if (!formName.trim()) setFormName(data.user.name || "");
      } else {
        setFormLinkedUser(null);
        alert(t("userNotFound"));
      }
    } catch {
      alert("Error searching user");
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleSave = async () => {
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: formName,
        phone: formPhone || null,
        role: formRole,
        hourlyRate: formHourlyRate,
      };
      if (formLinkedUser) {
        body.userId = formLinkedUser.id;
      }
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
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
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
      console.error("Error toggling:", error);
    } finally {
      setActionLoading(false);
    }
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
              {editingTeacher ? t("editTeacher") : t("addStaff")}
            </DialogTitle>
            <DialogDescription>
              {editingTeacher
                ? `Editing ${editingTeacher.name}`
                : t("addStaffDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Link to User by UID */}
            {!editingTeacher && (
              <div>
                <Label>{t("linkToUser")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={formUid}
                    onChange={(e) => setFormUid(e.target.value)}
                    placeholder={t("enterUid")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={searchUserByUid}
                    disabled={userSearchLoading || !formUid.trim()}
                  >
                    {userSearchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {formLinkedUser && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800 flex-1">
                      {formLinkedUser.name} ({formLinkedUser.email})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormLinkedUser(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            {editingTeacher?.user && (
              <div className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  {t("linkedTo")}: {editingTeacher.user.name} (
                  {editingTeacher.user.email})
                </span>
              </div>
            )}
            <div>
              <Label>{t("role")}</Label>
              <Select
                value={formRole}
                onValueChange={(v) =>
                  setFormRole(v as "TEACHER" | "COACH_ASSISTANT")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">{t("teacher")}</SelectItem>
                  <SelectItem value="COACH_ASSISTANT">
                    {t("coachAssistant")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>{t("hourlyRate")} (RM)</Label>
              <Input
                type="number"
                value={formHourlyRate || ""}
                onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                placeholder="0"
                className="w-32"
              />
              {formHourlyRate > 0 && (
                <Badge variant="outline" className="mt-1 text-xs">
                  RM{formHourlyRate}/hr
                </Badge>
              )}
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
