"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VideoUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: VideoUploadDialogProps) {
  const t = useTranslations("videos.upload");
  const tCat = useTranslations("videos.categories");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrl("");
    setCategory("");
    setIsExclusive(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error(t("requiredFields"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          url: url.trim(),
          category: category || null,
          isExclusive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create video");
      }

      toast.success(t("success"));
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-title">{t("videoTitle")}</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("videoTitlePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-url">{t("videoUrl")}</Label>
            <Input
              id="video-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">{t("urlHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-description">{t("description")}</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technique">{tCat("technique")}</SelectItem>
                <SelectItem value="drills">{tCat("drills")}</SelectItem>
                <SelectItem value="match-analysis">
                  {tCat("match-analysis")}
                </SelectItem>
                <SelectItem value="tips">{tCat("tips")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
            <div>
              <Label
                htmlFor="exclusive-toggle"
                className="text-sm font-medium cursor-pointer"
              >
                {t("exclusiveToggle")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("exclusiveHint")}
              </p>
            </div>
            <Switch
              id="exclusive-toggle"
              checked={isExclusive}
              onCheckedChange={setIsExclusive}
            />
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !url.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("publishing")}
              </>
            ) : (
              t("publish")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
