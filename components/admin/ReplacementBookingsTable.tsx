"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ReplacementBooking {
  id: string;
  status: string;
  createdAt: string;
  user: { name: string; phone: string };
  lessonSession: {
    lessonDate: string;
    startTime: string;
    endTime: string;
    court: { name: string };
  };
  replacementCredit: {
    absence: { lessonDate: string };
  };
}

const STATUS_COLOURS: Record<string, string> = {
  CONFIRMED: "bg-green-500/20 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/20 text-red-700 dark:text-red-400",
  COMPLETED: "bg-primary/20 text-primary",
};

export default function ReplacementBookingsTable() {
  const t = useTranslations("replacement");
  const [bookings, setBookings] = useState<ReplacementBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/replacement?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
      } else {
        toast.error("Failed to load replacement bookings");
      }
    } catch {
      toast.error("Failed to load replacement bookings");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            {t("admin.title")} {total > 0 && `(${total})`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="CONFIRMED">
                  {t("admin.status.CONFIRMED")}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {t("admin.status.CANCELLED")}
                </SelectItem>
                <SelectItem value="COMPLETED">
                  {t("admin.status.COMPLETED")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("admin.empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {b.user.name}
                    <span className="font-normal text-muted-foreground ml-2 text-xs">
                      {b.user.phone}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Replacement:</span>{" "}
                    {format(
                      new Date(b.lessonSession.lessonDate),
                      "EEE, dd MMM yyyy",
                    )}{" "}
                    {b.lessonSession.startTime}–{b.lessonSession.endTime} ·{" "}
                    {b.lessonSession.court.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Original absence:</span>{" "}
                    {format(
                      new Date(b.replacementCredit.absence.lessonDate),
                      "dd MMM yyyy",
                    )}
                    {" · "}
                    Booked {format(new Date(b.createdAt), "dd MMM yyyy")}
                  </p>
                </div>
                <Badge
                  className={`text-xs border-0 shrink-0 ml-3 ${STATUS_COLOURS[b.status] || ""}`}
                >
                  {t(`admin.status.${b.status}` as Parameters<typeof t>[0])}
                </Badge>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
