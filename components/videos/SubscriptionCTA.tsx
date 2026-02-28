"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface SubscriptionCTAProps {
  subscriptionStatus: string;
  expiryDate?: string | null;
  onSubscribe: () => void;
}

export function SubscriptionCTA({
  subscriptionStatus,
  expiryDate,
  onSubscribe,
}: SubscriptionCTAProps) {
  const t = useTranslations("videos");

  if (subscriptionStatus === "active") {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">
              {t("subscribedTitle")}
            </p>
            {expiryDate && (
              <p className="text-sm text-muted-foreground">
                {t("expiresOn", {
                  date: new Date(expiryDate).toLocaleDateString(),
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionStatus === "pending") {
    return (
      <div className="bg-secondary border border-border rounded-xl p-4 flex items-center gap-3">
        <Crown className="w-6 h-6 text-muted-foreground" />
        <div>
          <p className="font-semibold text-foreground">{t("pendingTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("pendingDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Crown className="w-7 h-7 text-primary mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground text-lg">
              {t("ctaTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("ctaDescription")}
            </p>
            <p className="text-sm font-semibold text-primary mt-1">
              RM19.90/{t("month")}
            </p>
          </div>
        </div>
        <Button
          onClick={onSubscribe}
          className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 whitespace-nowrap"
        >
          {t("subscribeNow")}
        </Button>
      </div>
    </div>
  );
}
