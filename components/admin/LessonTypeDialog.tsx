"use client";

import { useState } from "react";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export interface PricingTier {
  duration: number;
  price: number;
}

export interface LessonType {
  id: string;
  name: string;
  billingType: string;
  price: number;
  maxStudents: number;
  isActive: boolean;
  pricingTiers?: PricingTier[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: LessonType | null;
  onSaved: () => void;
}

export default function LessonTypeDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: Props) {
  const t = useTranslations("admin.lessonTypes");
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBillingType, setFormBillingType] = useState("per_session");
  const [formPrice, setFormPrice] = useState("");
  const [formMaxStudents, setFormMaxStudents] = useState("1");
  const [formTiers, setFormTiers] = useState<PricingTier[]>([]);

  const resetForm = (lt?: LessonType | null) => {
    setFormName(lt?.name || "");
    setFormBillingType(lt?.billingType || "per_session");
    setFormPrice(lt ? String(lt.price) : "");
    setFormMaxStudents(lt ? String(lt.maxStudents) : "1");
    setFormTiers(
      lt?.pricingTiers?.map((t) => ({
        duration: t.duration,
        price: t.price,
      })) || [],
    );
  };

  const handleOpenChange = (val: boolean) => {
    if (val) resetForm(editing);
    onOpenChange(val);
  };

  if (open && formName === "" && editing?.name) {
    resetForm(editing);
  }

  const addTier = () => setFormTiers([...formTiers, { duration: 0, price: 0 }]);

  const updateTier = (
    i: number,
    field: "duration" | "price",
    value: string,
  ) => {
    const updated = [...formTiers];
    updated[i] = { ...updated[i], [field]: Number(value) || 0 };
    setFormTiers(updated);
  };

  const removeTier = (i: number) =>
    setFormTiers(formTiers.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        billingType: formBillingType,
        price: Number(formPrice),
        maxStudents: Number(formMaxStudents),
      };
      if (formBillingType === "per_session") {
        body.pricingTiers = formTiers.filter(
          (t) => t.duration > 0 && t.price > 0,
        );
      }

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
        onOpenChange(false);
        onSaved();
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
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
            <Select value={formBillingType} onValueChange={setFormBillingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_session">{t("perSession")}</SelectItem>
                <SelectItem value="monthly">{t("perMonth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>
              {t("price")} (RM)
              {formBillingType === "per_session" && formTiers.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({t("basePrice")})
                </span>
              )}
            </Label>
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

          {formBillingType === "per_session" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("durationPricing")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTier}
                >
                  <Plus className="w-3 h-3 mr-1" /> {t("addTier")}
                </Button>
              </div>
              {formTiers.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noTiers")}</p>
              ) : (
                <div className="space-y-2">
                  {formTiers.map((tier, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tier.duration || ""}
                        onChange={(e) =>
                          updateTier(i, "duration", e.target.value)
                        }
                        placeholder={t("hours")}
                        min="0.5"
                        max="10"
                        step="0.5"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t("hrs")}
                      </span>
                      <Input
                        type="number"
                        value={tier.price || ""}
                        onChange={(e) => updateTier(i, "price", e.target.value)}
                        placeholder="RM"
                        min="0"
                        className="w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTier(i)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
