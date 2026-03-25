"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, Star } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";
import VerticalCutReveal from "@/components/ui/vertical-cut-reveal";
import { TimelineAnimation } from "@/components/ui/timeline-animation";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: number;
  unit: string;
  yearlyPrice?: number;
  yearlyUnit?: string;
  note?: string;
  popular?: boolean;
  features: PricingFeature[];
  href: string;
  cta: string;
  currency?: string;
}

interface PricingSectionProps {
  plans: PricingPlan[];
  title?: string;
  subtitle?: string;
  badge?: string;
  showToggle?: boolean;
}

function PricingCard({
  plan,
  isYearly,
  index,
}: {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const currency = plan.currency || "RM";

  return (
    <TimelineAnimation
      animationNum={index}
      timelineRef={ref}
      once
    >
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-500 h-full",
          plan.popular
            ? "bg-primary text-white shadow-xl shadow-primary/25 ring-4 ring-primary/10 scale-[1.02]"
            : "bg-card border border-border shadow-sm hover:border-primary/30 hover:shadow-lg"
        )}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {plan.popular && (
          <>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <SparklesCore
                className="absolute inset-0 h-full w-full"
                background="transparent"
                particleColor="#ffffff"
                particleDensity={8}
                speed={0.6}
                minSize={0.6}
                maxSize={1.4}
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm border border-white/20">
              <Star className="w-3 h-3 fill-white" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Popular
              </span>
            </div>
          </>
        )}

        <div className="relative z-10 p-8">
          <h3
            className={cn(
              "text-lg font-semibold mb-6",
              plan.popular ? "text-white" : "text-foreground"
            )}
          >
            {plan.name}
          </h3>

          {/* Price */}
          <div className="mb-2 flex items-baseline gap-1">
            <span
              className={cn(
                "text-sm font-medium",
                plan.popular ? "text-white/80" : "text-muted-foreground"
              )}
            >
              {currency}
            </span>
            <NumberFlow
              value={isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
              className={cn(
                "text-4xl font-bold tabular-nums",
                plan.popular ? "text-white" : "text-foreground"
              )}
              transformTiming={{ duration: 500, easing: "ease-out" }}
              spinTiming={{ duration: 500, easing: "ease-out" }}
            />
            <span
              className={cn(
                "text-sm",
                plan.popular ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {isYearly && plan.yearlyUnit ? plan.yearlyUnit : plan.unit}
            </span>
          </div>

          {plan.note && (
            <p
              className={cn(
                "text-sm mb-8",
                plan.popular ? "text-white/60" : "text-muted-foreground"
              )}
            >
              {plan.note}
            </p>
          )}

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                    plan.popular ? "bg-white/20" : "bg-primary/10"
                  )}
                >
                  <Check
                    className={cn(
                      "w-3 h-3",
                      !feature.included && "opacity-30",
                      plan.popular ? "text-white" : "text-primary"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm",
                    !feature.included && "line-through opacity-50",
                    plan.popular ? "text-white/90" : "text-muted-foreground"
                  )}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <a href={plan.href}>
            <button
              className={cn(
                "w-full h-11 font-medium rounded-lg flex items-center justify-center gap-2 group/btn transition-all duration-200",
                plan.popular
                  ? "bg-white text-primary hover:bg-white/90"
                  : "bg-primary hover:bg-primary/90 text-white"
              )}
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </a>
        </div>
      </motion.div>
    </TimelineAnimation>
  );
}

export function PricingSectionUI({
  plans,
  title = "Simple, Transparent Rates",
  subtitle = "No hidden fees. No membership required. Just book and play.",
  badge = "Pricing",
  showToggle = false,
}: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {badge}
            </span>
          </motion.div>

          <div className="overflow-hidden">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.08}
              staggerFrom="first"
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 21,
              }}
              containerClassName="text-2xl sm:text-3xl md:text-5xl font-bold font-display text-foreground mb-4 justify-center"
            >
              {title}
            </VerticalCutReveal>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            {subtitle}
          </motion.p>

          {/* Toggle */}
          {showToggle && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex items-center justify-center gap-4"
            >
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  !isYearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Standard
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors duration-300",
                  isYearly ? "bg-primary" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                    isYearly && "translate-x-5"
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isYearly ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Peak Hours
              </span>
            </motion.div>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isYearly={isYearly}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
