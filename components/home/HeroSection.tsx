"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="TZH Sports Centre"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content — centered */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-8 animate-in fade-in duration-700 fill-mode-forwards">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/80">{t("hero.openNow")}</span>
        </div>

        <p className="text-sm font-medium text-white/70 uppercase tracking-[0.2em] mb-6 animate-in fade-in duration-700 delay-100 fill-mode-forwards">
          {t("hero.location")}
        </p>

        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-6 animate-in fade-in duration-700 delay-200 fill-mode-forwards">
          {t("hero.headline")}
        </h1>

        <p className="text-lg md:text-xl text-white/70 uppercase tracking-[0.15em] mb-4 animate-in fade-in duration-700 delay-300 fill-mode-forwards">
          {t("hero.sportsList")}
        </p>

        <p className="text-base text-white/60 mb-10 max-w-lg mx-auto animate-in fade-in duration-700 delay-400 fill-mode-forwards">
          {t("hero.subheadline")}
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-4 animate-in fade-in duration-700 delay-500 fill-mode-forwards">
          <Link href="/booking">
            <Button className="h-12 px-6 sm:px-8 text-sm font-medium uppercase tracking-wider bg-primary hover:bg-primary/90 text-white rounded-full">
              {t("hero.bookCourt")}
            </Button>
          </Link>
          <Link href="/lessons">
            <Button
              variant="outline"
              className="h-12 px-6 sm:px-8 text-sm font-medium uppercase tracking-wider border-white/40 text-white hover:text-white bg-transparent hover:bg-white/10 dark:bg-transparent dark:hover:bg-white/10 rounded-full"
            >
              {t("hero.viewLessons")}
            </Button>
          </Link>
        </div>

        {/* No account needed + social proof */}
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-700 delay-500 fill-mode-forwards">
          <p className="text-xs text-white/50">{t("hero.noAccount")}</p>
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-xs text-white/60">{t("hero.socialProof")}</span>
          </div>
        </div>
      </div>

      {/* Value prop strip */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 animate-in fade-in duration-700 delay-700 fill-mode-forwards">
        <span className="text-xs text-white/50 uppercase tracking-wider">{t("hero.stat.courts")}</span>
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <span className="text-xs text-white/50 uppercase tracking-wider">{t("hero.stat.price")}</span>
        <span className="w-1 h-1 rounded-full bg-white/30" />
        <span className="text-xs text-white/50 uppercase tracking-wider">{t("hero.stat.hours")}</span>
      </div>
    </section>
  );
}

