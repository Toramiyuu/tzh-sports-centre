"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export function PricingSection() {
  const t = useTranslations("home.pricing");

  const plans = [
    {
      name: t("badminton.title"),
      price: "RM15",
      unit: "/hr",
      note: "Peak: RM18/hr",
      popular: false,
      features: ["Online booking", "Walk-ins welcome", "Quality vinyl flooring", "Zero-glare lighting", "Clean between sessions"],
      href: "/booking",
      cta: "Book Court",
    },
    {
      name: t("pickleball.title"),
      price: "RM25",
      unit: "/hr",
      note: "2hr minimum",
      popular: true,
      features: ["Online booking", "Equipment rental", "Beginner friendly", "Quality vinyl flooring", "Zero-glare lighting"],
      href: "/booking?sport=pickleball",
      cta: "Book Court",
    },
    {
      name: t("coaching.title"),
      price: "RM50",
      unit: "/mo",
      note: "Group classes from RM50. Private from RM130.",
      popular: false,
      features: ["BAM-certified coaches", "All skill levels", "Kids & adult groups", "Private sessions available", "Flexible scheduling"],
      href: "/lessons",
      cta: "View Lessons",
    },
  ];

  return (
    <section className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Rates
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("noHiddenFees")}
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards ${
                plan.popular
                  ? "bg-primary text-white border-2 border-primary shadow-lg shadow-primary/20"
                  : "bg-card border border-border hover:border-primary/30"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-xs font-bold uppercase tracking-wider">Popular</span>
                </div>
              )}

              <div className="p-8">
                <h3 className={`text-lg font-semibold mb-6 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-2">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>{plan.unit}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.popular ? "text-white/60" : "text-muted-foreground"}`}>{plan.note}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? "bg-white/20" : "bg-primary/10"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? "text-white" : "text-primary"}`} />
                      </div>
                      <span className={`text-sm ${plan.popular ? "text-white/90" : "text-muted-foreground"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.href}>
                  <Button className={`w-full h-11 font-medium rounded-lg group/btn ${
                    plan.popular
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Hours footer */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-in fade-in duration-700 delay-300 fill-mode-forwards">
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
    </section>
  );
}

