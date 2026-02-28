"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Loader2, RefreshCw, CalendarCheck } from "lucide-react";
import {
  BookingConfirmDialog,
  CancelConfirmDialog,
} from "@/components/profile/ReplacementDialogs";
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

interface DashboardReplacementSectionProps {
  onRefresh: () => void;
}

export function DashboardReplacementSection({
  onRefresh,
}: DashboardReplacementSectionProps) {
  const ta = useTranslations("absence");
  const tr = useTranslations("replacement");
  const tm = useTranslations("member");

  const [credits, setCredits] = useState<ReplacementCredit[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [confirmSession, setConfirmSession] = useState<AvailableSession | null>(
    null,
  );
  const [selectedCreditId, setSelectedCreditId] = useState("");
  const [booking, setBooking] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<MyBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [creditsRes, bookingsRes] = await Promise.all([
        fetch("/api/absences/credits"),
        fetch("/api/replacement/my-bookings"),
      ]);
      const [credData, bookData] = await Promise.all([
        creditsRes.json(),
        bookingsRes.json(),
      ]);
      if (creditsRes.ok) setCredits(credData.credits || []);
      if (bookingsRes.ok) setMyBookings(bookData.bookings || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/replacement/available");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setShowSessions(true);
      } else {
        toast.error(tr("errors.loadFailed"));
      }
    } catch {
      toast.error(tr("errors.loadFailed"));
    } finally {
      setSessionsLoading(false);
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
        toast.success(tr("bookSuccess"));
        setConfirmSession(null);
        setShowSessions(false);
        onRefresh();
        fetchData();
      } else {
        toast.error(data.error || tr("errors.bookFailed"));
      }
    } catch {
      toast.error(tr("errors.bookFailed"));
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
        toast.success(tr("cancelSuccess"));
        setCancelTarget(null);
        onRefresh();
        fetchData();
      } else {
        toast.error(data.error || tr("errors.cancelFailed"));
      }
    } catch {
      toast.error(tr("errors.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const hoursUntil = (dateStr: string) =>
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (credits.length === 0 && myBookings.length === 0) return null;

  return (
    <>
      {/* Replacement Credits */}
      {credits.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            {ta("credits.title")} ({credits.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {credits.map((c) => (
              <Badge
                key={c.id}
                className="bg-primary/10 text-primary border-0 text-sm py-1 px-3"
              >
                {ta("credits.badge")} · {ta("credits.expires")}{" "}
                {format(new Date(c.expiresAt), "dd MMM yyyy")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* My Replacement Bookings */}
      {myBookings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            {tr("myReplacements")}
          </p>
          {myBookings.map((b) => (
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
                {tm("absenceManagement.cancel")}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Book Replacement Sessions */}
      {credits.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            {tr("title")}
          </p>
          {!showSessions ? (
            <Button
              onClick={fetchSessions}
              disabled={sessionsLoading}
              variant="outline"
              className="w-full"
            >
              {sessionsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {tr("bookButton")}
            </Button>
          ) : (
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  {tr("noSessions")}
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
                        {tr("slotsAvailable", {
                          available: s.availableSlots,
                          max: s.maxStudents,
                        })}
                      </Badge>
                      <Button size="sm" onClick={() => openConfirm(s)}>
                        {tr("bookButton")}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
