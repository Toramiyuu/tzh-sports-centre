"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function SportsSection() {
  const t = useTranslations("home.availableSports");
  const tSports = useTranslations("home.sports");

  const sports = [
    {
      name: t("badminton.name"),
      courts: t("badminton.courts"),
      price: t("badminton.price"),
      image: "/images/badminton-action.jpg",
      href: "/booking",
      description: tSports("badmintonDesc"),
      highlights: [tSports("vinylFlooring"), tSports("zeroGlareLighting"), tSports("walkInsWelcome")],
    },
    {
      name: t("pickleball.name"),
      courts: t("pickleball.courts"),
      price: t("pickleball.price"),
      image: "/images/pickleball.jpg",
      href: "/booking?sport=pickleball",
      description: tSports("pickleballDesc"),
      highlights: [tSports("equipmentRental"), tSports("beginnerFriendly"), tSports("zeroGlareLighting")],
    },
  ];

  return (
    <section className="py-16 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header with badge */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{tSports("badge")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
            {tSports("title")}
          </h2>
        </div>

        {/* Sport Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {sports.map((sport) => (
            <div
              key={sport.name}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={sport.image}
                  alt={sport.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Floating price badge */}
                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm shadow-lg">
                  <span className="text-sm font-bold text-foreground">{sport.price}</span>
                </div>

                {/* Courts badge */}
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">{sport.courts}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {sport.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {sport.description}
                </p>

                {/* Highlight pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {sport.highlights.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-primary/8 text-primary border border-primary/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link href={sport.href}>
                  <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg group/btn">
                    {tSports("bookNow")}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

