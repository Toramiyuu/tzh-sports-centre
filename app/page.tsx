"use client";

import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { SportsSection } from "@/components/home/SportsSection";
import { PricingSection } from "@/components/home/PricingSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { StringingSection } from "@/components/home/StringingSection";
import { ShopSection } from "@/components/home/ShopSection";
import { LocationSection } from "@/components/home/LocationSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <AboutSection />
      <SportsSection />
      <PricingSection />
      <ReviewsSection />
      <StringingSection />
      <ShopSection />
      <LocationSection />
    </div>
  );
}
