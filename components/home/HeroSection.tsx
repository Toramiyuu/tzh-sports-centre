"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
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

        <div className="flex flex-wrap justify-center gap-4 animate-in fade-in duration-700 delay-500 fill-mode-forwards">
          <Link href="/booking">
            <Button className="h-12 px-6 sm:px-8 text-sm font-medium uppercase tracking-wider bg-primary hover:bg-primary/90 text-white rounded-sm">
              {t("hero.bookCourt")}
            </Button>
          </Link>
          <Link href="/lessons">
            <Button
              variant="outline"
              className="h-12 px-6 sm:px-8 text-sm font-medium uppercase tracking-wider border-white/40 text-white bg-transparent hover:bg-white/10 dark:bg-transparent dark:hover:bg-white/10 rounded-sm"
            >
              {t("hero.viewLessons")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-in fade-in duration-700 delay-700 fill-mode-forwards">
        <span className="text-xs text-white/50 uppercase tracking-[0.2em]">{t("hero.scroll")}</span>
        <div className="w-px h-8 bg-white/30" />
      </div>
    </section>
  );
}

