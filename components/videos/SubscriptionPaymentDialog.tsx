"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Download, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface SubscriptionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SUBSCRIPTION_AMOUNT = 19.9;

export function SubscriptionPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
}: SubscriptionPaymentDialogProps) {
  const t = useTranslations("videos.payment");
  const [paymentMethod, setPaymentMethod] = useState<"tng" | "duitnow">("tng");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const downloadQrCode = (method: string) => {
    const img =
      method === "tng" ? "/images/tng-qr.png" : "/images/duitnow-qr.png";
    const link = document.createElement("a");
    link.href = img;
    link.download = `${method}-qr.png`;
    link.click();
  };

  const handleSubmit = async () => {
    if (!receiptFile || !hasPaid) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      const uploadRes = await fetch("/api/upload/receipt", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload receipt");
      }

      const { url: receiptUrl } = await uploadRes.json();

      const subRes = await fetch("/api/videos/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          receiptUrl,
          amount: SUBSCRIPTION_AMOUNT,
        }),
      });

      if (!subRes.ok) {
        const err = await subRes.json();
        throw new Error(err.error || "Failed to subscribe");
      }

      toast.success(t("success"));
      onOpenChange(false);
      onSuccess();

      setReceiptFile(null);
      setReceiptPreview(null);
      setHasPaid(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div className="bg-secondary rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">{t("amount")}</p>
            <p className="text-2xl font-bold text-foreground">
              RM{SUBSCRIPTION_AMOUNT.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{t("duration")}</p>
          </div>

          {/* Payment method selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod("tng")}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                paymentMethod === "tng"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              Touch &apos;n Go
            </button>
            <button
              onClick={() => setPaymentMethod("duitnow")}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                paymentMethod === "duitnow"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              DuitNow
            </button>
          </div>

          {/* QR Code */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-card rounded-lg border-2 border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    paymentMethod === "tng"
                      ? "/images/tng-qr.png"
                      : "/images/duitnow-qr.png"
                  }
                  alt={`${paymentMethod === "tng" ? "TnG" : "DuitNow"} QR Code`}
                  className="w-48 h-48 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-border"
              onClick={() => downloadQrCode(paymentMethod)}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("saveQr")}
            </Button>
          </div>

          {/* Upload Receipt */}
          <div className="bg-secondary rounded-xl p-4 space-y-3 border border-border">
            <h4 className="font-semibold text-foreground text-sm">
              {t("uploadReceipt")}
            </h4>
            {receiptPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full max-h-48 object-contain rounded-lg border border-border"
                />
                <button
                  onClick={removeReceipt}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {t("receiptUploaded")}
                </p>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary hover:bg-secondary/50 transition-colors">
                  <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {t("tapToUpload")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("maxFileSize")}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptSelect}
                />
              </label>
            )}
          </div>

          {/* I have paid toggle */}
          <div className="bg-card border-2 border-primary/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasPaid && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                <Label
                  htmlFor="paid-toggle"
                  className="text-sm font-semibold text-foreground cursor-pointer"
                >
                  {t("iHavePaid")}
                </Label>
              </div>
              <Switch
                id="paid-toggle"
                checked={hasPaid}
                onCheckedChange={setHasPaid}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            className={`w-full h-12 font-semibold ${
              hasPaid && receiptFile
                ? "bg-primary hover:bg-primary/90"
                : "bg-accent cursor-not-allowed"
            }`}
            onClick={handleSubmit}
            disabled={!hasPaid || !receiptFile || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("confirmSubscription")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
