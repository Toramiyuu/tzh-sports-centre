"use client";

import { useEffect } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { Marquee } from "@/components/ui/marquee";
import VerticalCutReveal from "@/components/ui/vertical-cut-reveal";
import { CourtStatusSection } from "@/components/home/CourtStatusSection";
import { AboutSection } from "@/components/home/AboutSection";
import { FeatureCarousel } from "@/components/ui/feature-carousel";
import { PricingSection } from "@/components/home/PricingSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StringingSection } from "@/components/home/StringingSection";
import { ShopSection } from "@/components/home/ShopSection";
import { LocationSection } from "@/components/home/LocationSection";

export default function Home() {
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <div className="bg-primary py-3">
        <Marquee duration={35} pauseOnHover fade fadeAmount={5}>
          {[
            "Badminton — from RM 7.50 / 30 min",
            "Pickleball — from RM 12.50 / 30 min",
            "Peak pricing after 6 PM",
            "Ayer Itam, Penang",
            "Professional coaching available",
            "Pro shop & racket stringing on-site",
            "Open daily · 8 AM – 12 AM",
          ].map((item) => (
            <span key={item} className="mx-10 text-sm font-medium text-white/90 whitespace-nowrap flex items-center gap-3">
              <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
              {item}
            </span>
          ))}
        </Marquee>
      </div>
      <CourtStatusSection />
      <AboutSection />
      <section className="py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto mb-8 px-4 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">What we offer</p>
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.08}
            staggerFrom="first"
            containerClassName="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
            autoStart
          >
            Everything you need to play
          </VerticalCutReveal>
        </div>
        <FeatureCarousel />
      </section>
      <PricingSection />
      <ReviewsSection />
      <StringingSection />
      <ShopSection />
      <LocationSection />
    </div>
  );
}
