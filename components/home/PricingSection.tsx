"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { PricingSectionUI } from "@/components/ui/pricing-section";

export function PricingSection() {
  const t = useTranslations("home.pricing");

  const plans = [
    {
      name: t("badminton.title"),
      price: 15,
      unit: "/hr",
      yearlyPrice: 18,
      yearlyUnit: "/hr",
      note: "Peak: RM18/hr (after 6PM)",
      popular: true,
      features: [
        { text: "Online booking", included: true },
        { text: "Walk-ins welcome", included: true },
        { text: "Quality vinyl flooring", included: true },
        { text: "Zero-glare lighting", included: true },
        { text: "Clean between sessions", included: true },
      ],
      href: "/booking",
      cta: "Book Court",
    },
    {
      name: t("pickleball.title"),
      price: 25,
      unit: "/hr",
      note: "All hours",
      popular: false,
      features: [
        { text: "Online booking", included: true },
        { text: "Equipment rental", included: true },
        { text: "Beginner friendly", included: true },
        { text: "Quality vinyl flooring", included: true },
        { text: "Zero-glare lighting", included: true },
      ],
      href: "/booking?sport=pickleball",
      cta: "Book Court",
    },
    {
      name: t("coaching.title"),
      price: 50,
      unit: "/session",
      note: "Group classes from RM50. Private from RM130.",
      popular: false,
      features: [
        { text: "BAM-certified coaches", included: true },
        { text: "All skill levels", included: true },
        { text: "Kids & adult groups", included: true },
        { text: "Private sessions available", included: true },
        { text: "Flexible scheduling", included: true },
      ],
      href: "/lessons",
      cta: "View Lessons",
    },
  ];

  return (
    <>
      <PricingSectionUI
        plans={plans}
        title="Simple, Transparent Rates"
        subtitle={t("noHiddenFees")}
        badge="Pricing"
        showToggle={true}
      />

      {/* Hours footer */}
      <div className="-mt-16 md:-mt-24 pb-16 md:pb-24 bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t("hours.weekdays")}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t("hours.weekends")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
