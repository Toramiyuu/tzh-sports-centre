"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Loader2, Pencil, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

interface LessonType {
  id: string;
  name: string;
  billingType: string;
  price: number;
  maxStudents: number;
  isActive: boolean;
}

export default function LessonTypesContent() {
  const t = useTranslations("admin.lessonTypes");
  const [loading, setLoading] = useState(true);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LessonType | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formBillingType, setFormBillingType] = useState("per_session");
  const [formPrice, setFormPrice] = useState("");
  const [formMaxStudents, setFormMaxStudents] = useState("1");

  const fetchLessonTypes = useCallback(async () => {
    setLoading(true);
    try {
      const url = showInactive
        ? "/api/admin/lesson-types?active=false"
        : "/api/admin/lesson-types";
      const res = await fetch(url);
      const data = await res.json();
      setLessonTypes(data.lessonTypes || []);
    } catch (error) {
      console.error("Error fetching lesson types:", error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchLessonTypes();
  }, [fetchLessonTypes]);

  const openDialog = (lt?: LessonType) => {
    setEditing(lt || null);
    setFormName(lt?.name || "");
    setFormBillingType(lt?.billingType || "per_session");
    setFormPrice(lt ? String(lt.price) : "");
    setFormMaxStudents(lt ? String(lt.maxStudents) : "1");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    try {
      const body = {
        name: formName.trim(),
        billingType: formBillingType,
        price: Number(formPrice),
        maxStudents: Number(formMaxStudents),
      };

      const res = editing
        ? await fetch(`/api/admin/lesson-types/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/lesson-types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        setDialogOpen(false);
        fetchLessonTypes();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving lesson type:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (lt: LessonType) => {
    try {
      const res = await fetch(`/api/admin/lesson-types/${lt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !lt.isActive }),
      });
      if (res.ok) {
        fetchLessonTypes();
      }
    } catch (error) {
      console.error("Error toggling lesson type:", error);
    }
  };

  if (loading && lessonTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-border"
            />
            {t("showInactive")}
          </label>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-1" />
            {t("add")}
          </Button>
        </div>

        {lessonTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t("empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessonTypes.map((lt) => (
              <Card key={lt.id} className={!lt.isActive ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{lt.name}</p>
                      {!lt.isActive && (
                        <Badge variant="secondary">{t("inactive")}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      RM{lt.price.toFixed(2)}{" "}
                      {lt.billingType === "monthly"
                        ? t("perMonth")
                        : t("perSession")}
                      {lt.maxStudents > 1 &&
                        ` · ${t("maxStudents")}: ${lt.maxStudents}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(lt)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={lt.isActive ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(lt)}
                    >
                      {lt.isActive ? t("deactivate") : t("activate")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? t("editTitle") : t("addTitle")}
              </DialogTitle>
              <DialogDescription>
                {editing ? t("editDescription") : t("addDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t("name")}</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              </div>
              <div>
                <Label>{t("billingType")}</Label>
                <Select
                  value={formBillingType}
                  onValueChange={setFormBillingType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_session">
                      {t("perSession")}
                    </SelectItem>
                    <SelectItem value="monthly">{t("perMonth")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("price")} (RM)</Label>
                <Input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 130"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>{t("maxStudents")}</Label>
                <Input
                  type="number"
                  value={formMaxStudents}
                  onChange={(e) => setFormMaxStudents(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formName.trim() || !formPrice || saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? t("save") : t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
