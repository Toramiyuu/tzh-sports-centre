"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  CalendarIcon,
  CheckCircle2,
  Download,
  ImagePlus,
  Loader2,
  Smartphone,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  getStringById,
  RACKET_BRANDS,
  BRAND_COLORS,
  DEFAULT_TENSION,
  StringProduct,
} from "@/lib/stringing-config";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const t = useTranslations("stringing");
  const tCommon = useTranslations("common");

  const stringId = searchParams.get("string");
  const colorParam = searchParams.get("color");
  const [selectedString, setSelectedString] = useState<StringProduct | null>(
    null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(colorParam);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [racketModel, setRacketModel] = useState("");
  const [customRacket, setCustomRacket] = useState("");
  const [tensionMain, setTensionMain] = useState(DEFAULT_TENSION.main);
  const [tensionCross, setTensionCross] = useState(DEFAULT_TENSION.cross);
  const [pickupDate, setPickupDate] = useState<Date>(addDays(new Date(), 2));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showTngModal, setShowTngModal] = useState(false);
  const [tngHasPaid, setTngHasPaid] = useState(false);
  const [showDuitNowModal, setShowDuitNowModal] = useState(false);
  const [duitNowHasPaid, setDuitNowHasPaid] = useState(false);

  const [tngReceiptFile, setTngReceiptFile] = useState<File | null>(null);
  const [tngReceiptPreview, setTngReceiptPreview] = useState<string | null>(
    null,
  );
  const [duitNowReceiptFile, setDuitNowReceiptFile] = useState<File | null>(
    null,
  );
  const [duitNowReceiptPreview, setDuitNowReceiptPreview] = useState<
    string | null
  >(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [racketPresets, setRacketPresets] = useState<
    {
      id: string;
      name: string;
      brand: string;
      model: string;
      stringName: string | null;
      tensionMain: number | null;
      tensionCross: number | null;
      isDefault: boolean;
    }[]
  >([]);
  useEffect(() => {
    if (stringId) {
      const string = getStringById(stringId);
      if (string) {
        setSelectedString(string);
      } else {
        router.push("/stringing");
      }
    } else {
      router.push("/stringing");
    }
  }, [stringId, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  useEffect(() => {
    const fetchRacketPresets = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/profile/racket");
        if (res.ok) {
          const data = await res.json();
          setRacketPresets(data.racketProfiles || []);
        }
      } catch (error) {
        console.error("Error fetching racket presets:", error);
      }
    };

    fetchRacketPresets();
  }, [session]);

  const isFormValid = () => {
    return (
      name.trim() !== "" &&
      phone.trim() !== "" &&
      (racketModel !== "" || customRacket.trim() !== "") &&
      tensionMain >= DEFAULT_TENSION.minTension &&
      tensionMain <= DEFAULT_TENSION.maxTension &&
      tensionCross >= DEFAULT_TENSION.minTension &&
      tensionCross <= DEFAULT_TENSION.maxTension &&
      pickupDate
    );
  };

  const applyPreset = (presetId: string) => {
    const preset = racketPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const fullRacketModel = `${preset.brand} ${preset.model}`;

    const matchingBrand = RACKET_BRANDS.find((b) =>
      b.models.some((m) => `${b.name} ${m}` === fullRacketModel),
    );

    if (matchingBrand) {
      setRacketModel(fullRacketModel);
      setCustomRacket("");
    } else {
      setRacketModel("other");
      setCustomRacket(fullRacketModel);
    }

    if (preset.tensionMain) {
      setTensionMain(preset.tensionMain);
    }
    if (preset.tensionCross) {
      setTensionCross(preset.tensionCross);
    }

    toast.success(t("checkout.racketProfileApplied"));
  };

  const downloadQrCode = async (qrType: "tng" | "duitnow") => {
    const imagePath =
      qrType === "tng" ? "/images/tng-qr.png" : "/images/duitnow-qr.png";
    const filename =
      qrType === "tng" ? "TZH-TouchNGo-QR.png" : "TZH-DuitNow-QR.png";

    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("QR code saved to your device!");
    } catch (_err) {
      toast.error("Failed to download QR code");
    }
  };

  const handleReceiptSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "tng" | "duitnow",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("checkout.invalidFileType"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("checkout.fileTooLarge"));
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "tng") {
      setTngReceiptFile(file);
      setTngReceiptPreview(previewUrl);
    } else {
      setDuitNowReceiptFile(file);
      setDuitNowReceiptPreview(previewUrl);
    }
  };

  const removeReceipt = (type: "tng" | "duitnow") => {
    if (type === "tng") {
      if (tngReceiptPreview) URL.revokeObjectURL(tngReceiptPreview);
      setTngReceiptFile(null);
      setTngReceiptPreview(null);
    } else {
      if (duitNowReceiptPreview) URL.revokeObjectURL(duitNowReceiptPreview);
      setDuitNowReceiptFile(null);
      setDuitNowReceiptPreview(null);
    }
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/receipt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      return null;
    }
  };

  const handleSubmitOrder = async (
    paymentMethod: string,
    hasPaid: boolean,
    receiptFile: File | null,
  ) => {
    if (!selectedString || !isFormValid()) return;

    setSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        setUploadingReceipt(true);
        receiptUrl = await uploadReceipt(receiptFile);
        setUploadingReceipt(false);
        if (!receiptUrl) {
          toast.error(t("checkout.uploadFailed"));
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/stringing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stringId: selectedString.id,
          stringName: selectedString.fullName,
          stringColor: selectedColor || null,
          price: selectedString.price,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || null,
          racketModel:
            racketModel === "other" ? customRacket.trim() : racketModel,
          racketModelCustom:
            racketModel === "other" ? customRacket.trim() : null,
          tensionMain,
          tensionCross,
          pickupDate: format(pickupDate, "yyyy-MM-dd"),
          notes: notes.trim() || null,
          paymentMethod,
          paymentUserConfirmed: hasPaid,
          receiptUrl,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create order");
      }

      toast.success(t("checkout.orderSuccess"));
      setShowTngModal(false);
      setShowDuitNowModal(false);
      router.push("/stringing?success=true");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t("checkout.orderError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedString) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  const total = selectedString.price;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/stringing"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tCommon("back")}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t("checkout.title")}
        </h1>

        <div className="grid gap-6">
          {/* Selected String Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("checkout.selectedString")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      BRAND_COLORS[selectedString.brand] || "#666",
                  }}
                >
                  <Wrench className="w-8 h-8 text-white opacity-50" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {selectedString.brand}
                  </p>
                  <p className="font-semibold text-lg">{selectedString.name}</p>
                  {selectedString.gauge && (
                    <p className="text-sm text-muted-foreground">
                      {selectedString.gauge}
                    </p>
                  )}
                  {selectedColor && (
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: selectedColor.toLowerCase() }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedColor}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    RM{selectedString.price}
                  </p>
                  <Link
                    href="/stringing"
                    className="text-sm text-foreground hover:underline"
                  >
                    {t("checkout.changeString")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("checkout.customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("checkout.name")} *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("checkout.namePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("checkout.phone")} *</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={setPhone}
                    placeholder={t("checkout.phonePlaceholder")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("checkout.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("checkout.emailPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Racket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {t("checkout.racketDetails")}
                </CardTitle>
                {racketPresets.length > 0 && (
                  <Select onValueChange={applyPreset}>
                    <SelectTrigger className="w-auto gap-2 text-foreground border-border hover:bg-secondary">
                      <Wrench className="w-4 h-4" />
                      <SelectValue placeholder={t("checkout.useSavedRacket")} />
                    </SelectTrigger>
                    <SelectContent>
                      {racketPresets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name || `${preset.brand} ${preset.model}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Racket Model */}
              <div className="space-y-2">
                <Label>{t("checkout.racketModel")} *</Label>
                <Select value={racketModel} onValueChange={setRacketModel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("checkout.selectRacket")} />
                  </SelectTrigger>
                  <SelectContent>
                    {RACKET_BRANDS.map((brand) => (
                      <SelectGroup key={brand.name}>
                        <SelectLabel>{brand.name}</SelectLabel>
                        {brand.models.map((model) => (
                          <SelectItem
                            key={`${brand.name}-${model}`}
                            value={`${brand.name} ${model}`}
                          >
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                    <SelectGroup>
                      <SelectLabel>Other</SelectLabel>
                      <SelectItem value="other">
                        {t("checkout.otherRacket")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Racket Input */}
              {racketModel === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customRacket">
                    {t("checkout.customRacket")} *
                  </Label>
                  <Input
                    id="customRacket"
                    value={customRacket}
                    onChange={(e) => setCustomRacket(e.target.value)}
                    placeholder={t("checkout.customRacketPlaceholder")}
                    required
                  />
                </div>
              )}

              {/* Tension */}
              <div className="space-y-2">
                <Label>{t("checkout.tension")} *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="tensionMain"
                      className="text-sm text-muted-foreground"
                    >
                      {t("checkout.tensionMain")}
                    </Label>
                    <Input
                      id="tensionMain"
                      type="number"
                      min={DEFAULT_TENSION.minTension}
                      max={DEFAULT_TENSION.maxTension}
                      value={tensionMain}
                      onChange={(e) =>
                        setTensionMain(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="tensionCross"
                      className="text-sm text-muted-foreground"
                    >
                      {t("checkout.tensionCross")}
                    </Label>
                    <Input
                      id="tensionCross"
                      type="number"
                      min={DEFAULT_TENSION.minTension}
                      max={DEFAULT_TENSION.maxTension}
                      value={tensionCross}
                      onChange={(e) =>
                        setTensionCross(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("checkout.tensionHelp")}
                </p>
              </div>

              {/* Pickup Date */}
              <div className="space-y-2">
                <Label>{t("checkout.pickupDate")} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !pickupDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {pickupDate ? (
                        format(pickupDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={(date) => date && setPickupDate(date)}
                      disabled={(date) => date < addDays(new Date(), 1)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  {t("checkout.pickupDateHelp")}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t("checkout.notes")}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("checkout.notesPlaceholder")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("checkout.payment")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <span className="font-medium">{t("checkout.total")}</span>
                <span className="text-2xl font-bold text-foreground">
                  RM{total}
                </span>
              </div>

              {/* Payment Buttons */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-14 text-base border-2 border-border text-foreground hover:bg-secondary"
                  onClick={() => setShowTngModal(true)}
                  disabled={!isFormValid()}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  {t("payment.tng")}
                </Button>
                <Button
                  variant="outline"
                  className="h-14 text-base border-2 border-border text-foreground hover:bg-secondary"
                  onClick={() => setShowDuitNowModal(true)}
                  disabled={!isFormValid()}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  {t("payment.duitnow")}
                </Button>
              </div>

              {!isFormValid() && (
                <p className="text-sm text-center text-orange-600">
                  {t("checkout.requiredField")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Touch 'n Go Payment Modal */}
      <Dialog open={showTngModal} onOpenChange={setShowTngModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-foreground" />
              {t("payment.tng")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Banner */}
            <div className="bg-foreground text-white rounded-xl p-4 text-center">
              <p className="text-sm opacity-90">{t("payment.amount")}</p>
              <p className="text-3xl font-bold">RM{total.toFixed(2)}</p>
            </div>

            {/* Step 1: Save QR Code */}
            <div className="bg-background rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-semibold text-foreground">
                  Save the QR Code
                </h4>
              </div>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                  <img
                    src="/images/tng-qr.png"
                    alt="Touch 'n Go QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 text-base border-2 border-border text-foreground hover:bg-secondary"
                onClick={() => downloadQrCode("tng")}
              >
                <Download className="mr-2 h-5 w-5" />
                Save QR Code to Gallery
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Open Touch &apos;n Go App
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Open your Touch &apos;n Go eWallet app
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Scan from Gallery
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tap &apos;Scan&apos;, then select the QR code from your
                    gallery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Enter Amount</p>
                  <p className="text-sm text-muted-foreground">
                    Enter exactly{" "}
                    <strong className="text-foreground">
                      RM{total.toFixed(2)}
                    </strong>
                  </p>
                </div>
              </div>
              {/* Step 5: Upload Receipt */}
              <div className="bg-background rounded-xl p-4 space-y-3 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {t("checkout.uploadReceipt")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("checkout.uploadReceiptDesc")}
                    </p>
                  </div>
                </div>

                {tngReceiptPreview ? (
                  <div className="relative">
                    <img
                      src={tngReceiptPreview}
                      alt="Receipt preview"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeReceipt("tng")}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {t("checkout.receiptUploaded")}
                    </p>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-secondary/50 transition-colors">
                      <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {t("checkout.tapToUpload")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("checkout.maxFileSize")}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReceiptSelect(e, "tng")}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* "I have paid" Toggle */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tngHasPaid && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  <Label
                    htmlFor="tng-paid-toggle"
                    className="text-base font-semibold text-foreground cursor-pointer"
                  >
                    {t("checkout.iHavePaid")}
                  </Label>
                </div>
                <Switch
                  id="tng-paid-toggle"
                  checked={tngHasPaid}
                  onCheckedChange={setTngHasPaid}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <p className="text-xs text-yellow-800">
                {t("payment.afterPayment")}
              </p>
            </div>

            {/* Confirm Button */}
            <Button
              className={`w-full h-14 text-lg font-semibold ${tngHasPaid ? "bg-foreground hover:bg-foreground/90" : "bg-accent cursor-not-allowed"}`}
              size="lg"
              onClick={() =>
                handleSubmitOrder("tng", tngHasPaid, tngReceiptFile)
              }
              disabled={!tngHasPaid || submitting || uploadingReceipt}
            >
              {submitting || uploadingReceipt ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {uploadingReceipt
                    ? t("checkout.uploadingReceipt")
                    : "Processing..."}
                </>
              ) : (
                t("checkout.confirmOrder")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DuitNow Payment Modal */}
      <Dialog open={showDuitNowModal} onOpenChange={setShowDuitNowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-foreground" />
              {t("payment.duitnow")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Banner */}
            <div className="bg-foreground text-white rounded-xl p-4 text-center">
              <p className="text-sm opacity-90">{t("payment.amount")}</p>
              <p className="text-3xl font-bold">RM{total.toFixed(2)}</p>
            </div>

            {/* Step 1: Save QR Code */}
            <div className="bg-background rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-semibold text-foreground">
                  Save the QR Code
                </h4>
              </div>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                  <img
                    src="/images/duitnow-qr.png"
                    alt="DuitNow QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 text-base border-2 border-border text-foreground hover:bg-secondary"
                onClick={() => downloadQrCode("duitnow")}
              >
                <Download className="mr-2 h-5 w-5" />
                Save QR Code to Gallery
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Open Banking App
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Open your banking app that supports DuitNow
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Scan QR Code</p>
                  <p className="text-sm text-muted-foreground">
                    Select DuitNow QR and scan from gallery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-7 h-7 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Enter Amount</p>
                  <p className="text-sm text-muted-foreground">
                    Enter exactly{" "}
                    <strong className="text-foreground">
                      RM{total.toFixed(2)}
                    </strong>
                  </p>
                </div>
              </div>
              {/* Step 5: Upload Receipt */}
              <div className="bg-background rounded-xl p-4 space-y-3 border border-pink-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {t("checkout.uploadReceipt")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("checkout.uploadReceiptDesc")}
                    </p>
                  </div>
                </div>

                {duitNowReceiptPreview ? (
                  <div className="relative">
                    <img
                      src={duitNowReceiptPreview}
                      alt="Receipt preview"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeReceipt("duitnow")}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {t("checkout.receiptUploaded")}
                    </p>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-pink-300 rounded-lg p-6 text-center hover:border-pink-500 hover:bg-secondary/50 transition-colors">
                      <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {t("checkout.tapToUpload")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("checkout.maxFileSize")}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReceiptSelect(e, "duitnow")}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* "I have paid" Toggle */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {duitNowHasPaid && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  <Label
                    htmlFor="duitnow-paid-toggle"
                    className="text-base font-semibold text-foreground cursor-pointer"
                  >
                    {t("checkout.iHavePaid")}
                  </Label>
                </div>
                <Switch
                  id="duitnow-paid-toggle"
                  checked={duitNowHasPaid}
                  onCheckedChange={setDuitNowHasPaid}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <p className="text-xs text-yellow-800">
                {t("payment.afterPayment")}
              </p>
            </div>

            {/* Confirm Button */}
            <Button
              className={`w-full h-14 text-lg font-semibold ${duitNowHasPaid ? "bg-foreground hover:bg-foreground/90" : "bg-accent cursor-not-allowed"}`}
              size="lg"
              onClick={() =>
                handleSubmitOrder("duitnow", duitNowHasPaid, duitNowReceiptFile)
              }
              disabled={!duitNowHasPaid || submitting || uploadingReceipt}
            >
              {submitting || uploadingReceipt ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {uploadingReceipt
                    ? t("checkout.uploadingReceipt")
                    : "Processing..."}
                </>
              ) : (
                t("checkout.confirmOrder")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StringingCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
