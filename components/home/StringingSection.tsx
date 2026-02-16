"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Check, Wrench } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function StringingSection() {
  const t = useTranslations("home.stringingPromo");

  const features = ["18+ String Options", "Same-Day Service", "Expert Tension", "All Brands"];

  return (
    <section className="relative py-16 md:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/strings-bg.jpg"
          alt="Racket stringing"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6 animate-in fade-in duration-700 fill-mode-forwards">
            <Wrench className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Professional Service</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 animate-in fade-in duration-700 delay-100 fill-mode-forwards">
            {t("title")}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-8 animate-in fade-in duration-700 delay-200 fill-mode-forwards">
            {t("description")}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mb-10 animate-in fade-in duration-700 delay-300 fill-mode-forwards">
            {features.map((f) => (
              <span key={f} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white">
                <Check className="w-3.5 h-3.5 text-green-400" />
                {f}
              </span>
            ))}
          </div>

          <Link href="/stringing" className="animate-in fade-in duration-700 delay-400 fill-mode-forwards inline-block">
            <Button className="h-12 px-6 sm:px-8 bg-white text-black hover:bg-white/90 font-medium rounded-lg group/btn">
              {t("cta")}
              <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

