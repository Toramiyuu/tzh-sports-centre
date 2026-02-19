"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Loader2, RefreshCw } from "lucide-react";
import {
  BookingConfirmDialog,
  CancelConfirmDialog,
} from "./ReplacementDialogs";
import { toast } from "sonner";

interface ReplacementCredit {
  id: string;
  expiresAt: string;
  absence: { lessonDate: string; type: string };
}

interface AvailableSession {
  id: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  lessonType: string;
  court: { name: string };
  availableSlots: number;
  maxStudents: number;
}

interface MyBooking {
  id: string;
  lessonSession: {
    id: string;
    lessonDate: string;
    startTime: string;
    endTime: string;
    court: { name: string };
  };
}

interface Props {
  credits: ReplacementCredit[];
  onRefresh: () => void;
}

export function ReplacementBookingSection({ credits, onRefresh }: Props) {
  const t = useTranslations("replacement");
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [confirmSession, setConfirmSession] = useState<AvailableSession | null>(
    null,
  );
  const [selectedCreditId, setSelectedCreditId] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<MyBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/replacement/my-bookings");
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data.bookings || []);
      } else {
        toast.error(t("errors.loadFailed"));
      }
    } catch {
      toast.error(t("errors.loadFailed"));
    }
  }, [t]);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/replacement/available");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setShowSessions(true);
      } else {
        toast.error(t("errors.loadFailed"));
      }
    } catch {
      toast.error(t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (session: AvailableSession) => {
    setConfirmSession(session);
    setSelectedCreditId(credits[0]?.id ?? "");
  };

  const confirmBook = async () => {
    if (!confirmSession || !selectedCreditId) return;
    setBooking(true);
    try {
      const res = await fetch("/api/replacement/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditId: selectedCreditId,
          lessonSessionId: confirmSession.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("bookSuccess"));
        setConfirmSession(null);
        setShowSessions(false);
        onRefresh();
        fetchMyBookings();
      } else {
        toast.error(data.error || t("errors.bookFailed"));
      }
    } catch {
      toast.error(t("errors.bookFailed"));
    } finally {
      setBooking(false);
    }
  };

  const cancelBooking = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/replacement/${cancelTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("cancelSuccess"));
        setCancelTarget(null);
        onRefresh();
        fetchMyBookings();
      } else {
        toast.error(data.error || t("errors.cancelFailed"));
      }
    } catch {
      toast.error(t("errors.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const hoursUntil = (dateStr: string) =>
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60);

  if (credits.length === 0 && myBookings.length === 0) return null;

  return (
    <>
      {/* My Replacement Sessions */}
      {(myBookings.length > 0 || credits.length > 0) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              {t("myReplacements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noBookings")}
              </p>
            ) : (
              myBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(
                        new Date(b.lessonSession.lessonDate),
                        "EEE, dd MMM yyyy",
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.lessonSession.startTime}–{b.lessonSession.endTime} ·{" "}
                      {b.lessonSession.court.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => setCancelTarget(b)}
                  >
                    {t("cancelConfirm").split("?")[0]}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Book Replacement */}
      {credits.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              {t("title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showSessions ? (
              <Button
                onClick={fetchSessions}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("bookButton")}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("availableSessions")}
                </p>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("noSessions")}
                  </p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(s.lessonDate), "EEE, dd MMM yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.startTime}–{s.endTime} · {s.court.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          {t("slotsAvailable", {
                            available: s.availableSlots,
                            max: s.maxStudents,
                          })}
                        </Badge>
                        <Button size="sm" onClick={() => openConfirm(s)}>
                          {t("bookButton")}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <BookingConfirmDialog
        session={confirmSession}
        onClose={() => setConfirmSession(null)}
        credits={credits}
        selectedCreditId={selectedCreditId}
        onCreditChange={setSelectedCreditId}
        booking={booking}
        onConfirm={confirmBook}
      />

      <CancelConfirmDialog
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
        cancelling={cancelling}
        onConfirm={cancelBooking}
        isForfeit={
          !!cancelTarget &&
          hoursUntil(cancelTarget.lessonSession.lessonDate) <= 24
        }
      />
    </>
  );
}
