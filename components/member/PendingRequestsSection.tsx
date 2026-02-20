"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useLessonTypes } from "@/lib/hooks/useLessonTypes";

interface LessonRequest {
  id: string;
  requestedDate: string;
  requestedTime: string;
  lessonType: string;
  requestedDuration: number;
  status: string;
  adminNotes: string | null;
  suggestedTime: string | null;
  createdAt: string;
}

interface PendingRequestsSectionProps {
  requests: LessonRequest[];
  onCancel: (requestId: string) => void;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function PendingRequestsSection({
  requests,
  onCancel,
}: PendingRequestsSectionProps) {
  const t = useTranslations("member");
  const { getLessonPrice } = useLessonTypes();

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          {t("pendingRequests")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 bg-background rounded-xl border border-border flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {format(
                    new Date(request.requestedDate),
                    "EEEE, MMMM d, yyyy",
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(request.requestedTime)} -{" "}
                  {request.lessonType.replace(/-/g, " ")} {t("lesson")} (
                  {request.requestedDuration}hr)
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground mb-2">
                  RM
                  {getLessonPrice(
                    request.lessonType,
                    request.requestedDuration,
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onCancel(request.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
