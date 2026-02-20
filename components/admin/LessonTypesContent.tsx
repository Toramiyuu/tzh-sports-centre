"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Pencil, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import LessonTypeDialog, { type LessonType } from "./LessonTypeDialog";

export default function LessonTypesContent() {
  const t = useTranslations("admin.lessonTypes");
  const [loading, setLoading] = useState(true);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LessonType | null>(null);

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
    setDialogOpen(true);
  };

  const handleToggleActive = async (lt: LessonType) => {
    try {
      const res = await fetch(`/api/admin/lesson-types/${lt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !lt.isActive }),
      });
      if (res.ok) fetchLessonTypes();
    } catch (error) {
      console.error("Error toggling lesson type:", error);
    }
  };

  const formatPricing = (lt: LessonType) => {
    if (lt.billingType === "monthly") {
      return `RM${lt.price.toFixed(2)} ${t("perMonth")}`;
    }
    if (lt.pricingTiers && lt.pricingTiers.length > 0) {
      return lt.pricingTiers
        .map((tier) => `${tier.duration}hr = RM${tier.price.toFixed(2)}`)
        .join(" · ");
    }
    return `RM${lt.price.toFixed(2)} ${t("perSession")}`;
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
                      {formatPricing(lt)}
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

        <LessonTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
          onSaved={fetchLessonTypes}
        />
      </div>
    </div>
  );
}
