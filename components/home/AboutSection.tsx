"use client";

import { Clock, GraduationCap, Star, Trophy, Wrench, Zap } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("home");

  const features = [
    {
      icon: Trophy,
      title: "Professional Courts",
      description: "4 courts with quality vinyl flooring and side-mounted lighting with zero glare.",
    },
    {
      icon: Wrench,
      title: "Racket Stringing",
      description: "On-site stringing service with 18+ string options. Same-day turnaround available.",
    },
    {
      icon: GraduationCap,
      title: "Expert Coaching",
      description: "BAM-certified coaches for all levels. Private and group sessions available.",
    },
  ];

  const stats = [
    { icon: Trophy, value: "4", label: t("hero.stat.courts") },
    { icon: Star, value: "4.7", label: "Google Rating" },
    { icon: Zap, value: "RM15", label: "From / Hour" },
    { icon: Clock, value: "12AM", label: "Open Until" },
  ];

  return (
    <section className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in duration-700 fill-mode-forwards">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.2em] mb-4">
            Our Courts
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Built for Players
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ayer Itam&apos;s home for badminton and pickleball — book online, show up, and play.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image with decorative accent */}
          <div className="relative animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <div className="absolute -inset-4 bg-primary/10 rounded-2xl -rotate-2" />
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/images/facility-interior.jpg"
                alt="TZH Sports Centre courts"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs uppercase tracking-[0.1em] text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

