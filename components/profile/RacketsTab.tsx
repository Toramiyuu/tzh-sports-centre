"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { RacketPresetDialog, type RacketPreset } from "./RacketPresetDialog";

const MAX_PRESETS = 3;

export function RacketsTab() {
  const t = useTranslations("profile.rackets");
  const [presets, setPresets] = useState<RacketPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<RacketPreset | null>(null);

  useEffect(() => {
    fetchPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await fetch("/api/profile/racket");
      if (res.ok) {
        const data = await res.json();
        setPresets(data.racketProfiles || []);
      }
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPreset(null);
    setShowDialog(true);
  };

  const openEdit = (preset: RacketPreset) => {
    setEditingPreset(preset);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/profile/racket", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success(t("deleted"));
        fetchPresets();
      } else {
        toast.error(t("deleteError"));
      }
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const handleSetDefault = async (preset: RacketPreset) => {
    if (preset.isDefault) return;
    try {
      const res = await fetch("/api/profile/racket", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: preset.id,
          name: preset.name,
          brand: preset.brand,
          model: preset.model,
          stringName: preset.stringName,
          tensionMain: preset.tensionMain,
          tensionCross: preset.tensionCross,
          isDefault: true,
        }),
      });
      if (res.ok) {
        toast.success(t("setDefault"));
        fetchPresets();
      }
    } catch {
      toast.error(t("saveError"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {presets.length < MAX_PRESETS && (
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t("add")}
          </Button>
        )}
      </div>

      {presets.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">{t("empty")}</p>
            <Button onClick={openCreate} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {t("addFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <Card
              key={preset.id}
              className={`bg-card border-border relative ${preset.isDefault ? "ring-2 ring-primary" : ""}`}
            >
              {preset.isDefault && (
                <Badge className="absolute top-3 right-3 bg-primary/10 text-primary border-0 text-xs">
                  <Star className="w-3 h-3 mr-1 fill-primary" />
                  {t("default")}
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{preset.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("racket")}</span>
                  <span className="font-medium text-foreground">
                    {preset.brand} {preset.model}
                  </span>
                </div>
                {preset.stringName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("string")}</span>
                    <span className="font-medium text-foreground">
                      {preset.stringName}
                    </span>
                  </div>
                )}
                {(preset.tensionMain || preset.tensionCross) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("tension")}
                    </span>
                    <span className="font-medium text-foreground">
                      {preset.tensionMain}/{preset.tensionCross} lbs
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => openEdit(preset)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    {t("edit")}
                  </Button>
                  {!preset.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleSetDefault(preset)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {t("makeDefault")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(preset.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RacketPresetDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        preset={editingPreset}
        onSaved={fetchPresets}
      />
    </div>
  );
}
