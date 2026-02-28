"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Subscription {
  id: string;
  status: string;
  amount: number;
  paymentMethod: string | null;
  receiptUrl: string | null;
  startDate: string | null;
  expiryDate: string | null;
  approvedBy: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  active: "bg-green-500/10 text-green-600",
  expired: "bg-gray-500/10 text-gray-600",
  cancelled: "bg-red-500/10 text-red-600",
};

export function VideoSubscriptionsTab() {
  const t = useTranslations("videos.admin");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/admin/videos/subscriptions");
      if (res.ok) {
        setSubscriptions(await res.json());
      }
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/videos/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(action === "approve" ? t("approved") : t("rejected"));
      fetchSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("noSubscriptions")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <div
          key={sub.id}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{sub.user.name}</p>
                <Badge
                  variant="secondary"
                  className={statusColors[sub.status] || ""}
                >
                  {sub.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {sub.user.email} · {sub.user.phone}
              </p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>RM{sub.amount.toFixed(2)}</span>
                {sub.paymentMethod && (
                  <span className="uppercase">{sub.paymentMethod}</span>
                )}
                <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
              </div>
              {sub.startDate && sub.expiryDate && (
                <p className="text-xs text-muted-foreground">
                  {t("activePeriod", {
                    start: new Date(sub.startDate).toLocaleDateString(),
                    end: new Date(sub.expiryDate).toLocaleDateString(),
                  })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {sub.receiptUrl && (
                <a
                  href={sub.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {t("viewReceipt")}
                  </Button>
                </a>
              )}
              {sub.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAction(sub.id, "approve")}
                    disabled={actionLoading === sub.id}
                  >
                    {actionLoading === sub.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    )}
                    {t("approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleAction(sub.id, "reject")}
                    disabled={actionLoading === sub.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {t("reject")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
