"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  RACKET_BRANDS,
  STRING_INVENTORY,
  DEFAULT_TENSION,
} from "@/lib/stringing-config";

export interface RacketPreset {
  id: string;
  name: string;
  brand: string;
  model: string;
  stringName: string | null;
  tensionMain: number | null;
  tensionCross: number | null;
  isDefault: boolean;
}

interface RacketPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: RacketPreset | null;
  onSaved: () => void;
}

const stringOptions = STRING_INVENTORY.map((s) => ({
  value: s.fullName,
  label: s.fullName,
  brand: s.brand,
}));
const stringBrands = [...new Set(stringOptions.map((s) => s.brand))];

export function RacketPresetDialog({
  open,
  onOpenChange,
  preset,
  onSaved,
}: RacketPresetDialogProps) {
  const t = useTranslations("profile.rackets");
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formCustomModel, setFormCustomModel] = useState("");
  const [formStringName, setFormStringName] = useState("");
  const [formTensionMain, setFormTensionMain] = useState(DEFAULT_TENSION.main);
  const [formTensionCross, setFormTensionCross] = useState(
    DEFAULT_TENSION.cross,
  );

  useEffect(() => {
    if (!open) return;
    if (preset) {
      setFormName(preset.name);
      setFormStringName(preset.stringName || "");
      setFormTensionMain(preset.tensionMain || DEFAULT_TENSION.main);
      setFormTensionCross(preset.tensionCross || DEFAULT_TENSION.cross);
      const fullModel = `${preset.brand} ${preset.model}`;
      const match = RACKET_BRANDS.find((b) =>
        b.models.some((m) => `${b.name} ${m}` === fullModel),
      );
      if (match) {
        setFormBrand(match.name);
        setFormModel(fullModel);
        setFormCustomModel("");
      } else {
        setFormBrand("other");
        setFormModel("other");
        setFormCustomModel(fullModel);
      }
    } else {
      setFormName("");
      setFormBrand("");
      setFormModel("");
      setFormCustomModel("");
      setFormStringName("");
      setFormTensionMain(DEFAULT_TENSION.main);
      setFormTensionCross(DEFAULT_TENSION.cross);
    }
  }, [open, preset]);

  const handleSave = async () => {
    const resolvedBrand =
      formBrand === "other" ? formCustomModel.split(" ")[0] : formBrand;
    const resolvedModel =
      formModel === "other"
        ? formCustomModel.trim()
        : formModel.replace(`${formBrand} `, "");

    if (!formName.trim() || !resolvedBrand.trim() || !resolvedModel.trim()) {
      toast.error(t("requiredFields"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        brand: resolvedBrand.trim(),
        model: resolvedModel.trim(),
        stringName: formStringName || null,
        tensionMain: formTensionMain,
        tensionCross: formTensionCross,
      };

      const res = await fetch("/api/profile/racket", {
        method: preset ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset ? { id: preset.id, ...payload } : payload),
      });

      if (res.ok) {
        toast.success(preset ? t("updated") : t("created"));
        onOpenChange(false);
        onSaved();
      } else {
        const data = await res.json();
        toast.error(data.error || t("saveError"));
      }
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{preset ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("presetName")} *</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t("presetNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("racketBrand")} *</Label>
            <Select
              value={formBrand}
              onValueChange={(v) => {
                setFormBrand(v);
                setFormModel("");
                setFormCustomModel("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectBrand")} />
              </SelectTrigger>
              <SelectContent>
                {RACKET_BRANDS.map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
                <SelectItem value="other">{t("otherBrand")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formBrand && formBrand !== "other" && (
            <div className="space-y-2">
              <Label>{t("racketModel")} *</Label>
              <Select value={formModel} onValueChange={setFormModel}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {RACKET_BRANDS.find((b) => b.name === formBrand)?.models.map(
                    (m) => (
                      <SelectItem key={m} value={`${formBrand} ${m}`}>
                        {m}
                      </SelectItem>
                    ),
                  )}
                  <SelectItem value="other">{t("otherModel")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(formBrand === "other" || formModel === "other") && (
            <div className="space-y-2">
              <Label>{t("customModel")} *</Label>
              <Input
                value={formCustomModel}
                onChange={(e) => setFormCustomModel(e.target.value)}
                placeholder={t("customModelPlaceholder")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("preferredString")}</Label>
            <Select value={formStringName} onValueChange={setFormStringName}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectString")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("noPreference")}</SelectItem>
                {stringBrands.map((brand) => (
                  <SelectGroup key={brand}>
                    <SelectLabel>{brand}</SelectLabel>
                    {stringOptions
                      .filter((s) => s.brand === brand)
                      .map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("tension")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("main")}
                </Label>
                <Input
                  type="number"
                  min={DEFAULT_TENSION.minTension}
                  max={DEFAULT_TENSION.maxTension}
                  value={formTensionMain}
                  onChange={(e) =>
                    setFormTensionMain(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {t("cross")}
                </Label>
                <Input
                  type="number"
                  min={DEFAULT_TENSION.minTension}
                  max={DEFAULT_TENSION.maxTension}
                  value={formTensionCross}
                  onChange={(e) =>
                    setFormTensionCross(parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("tensionRange")}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {preset ? t("save") : t("create")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
