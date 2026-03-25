"use client";

import { ArrowRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { EditorialTestimonial } from "@/components/ui/editorial-testimonial";

const TZH_REVIEWS = [
  {
    quote: "So hot but fun as hell! The courts are well-maintained and the booking system is super convenient. Love that it's open till midnight.",
    author: "Ying Jie Teoh",
    role: "Google Review · 2 weeks ago",
    stars: 5,
  },
  {
    quote: "Best badminton courts in Ayer Itam. Clean courts, good lighting with no glare, and the prices are very reasonable.",
    author: "Wei Liang C.",
    role: "Google Review · 3 weeks ago",
    stars: 5,
  },
  {
    quote: "Tried pickleball here for the first time — great experience. Paddles available for rent and the staff are friendly. Easy online booking too.",
    author: "Sarah L.",
    role: "Google Review · a month ago",
    stars: 5,
  },
  {
    quote: "Good facility with quality flooring. The coaching sessions are worth it — Coach is patient and knowledgeable. Racket stringing service is a nice bonus.",
    author: "Marcus T.",
    role: "Google Review · 2 months ago",
    stars: 4,
  },
];

export function ReviewsSection() {
  const t = useTranslations("home.googleReviews");

  return (
    <section className="py-16 md:py-28 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t("subtitle")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display text-foreground">
            {t("sectionTitle")}
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 lg:gap-20 items-start">
          {/* Left — editorial testimonial */}
          <EditorialTestimonial testimonials={TZH_REVIEWS} />

          {/* Right — Google rating card */}
          <div className="lg:pt-6">
            <div className="rounded-2xl bg-primary p-8 text-white shadow-lg shadow-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold">4.7</div>
                  <div className="text-white/70 text-sm">{t("googleRating")}</div>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-5 w-5 fill-white text-white" />
                ))}
              </div>
              <p className="text-white/80 text-sm mb-6">{t("basedOn")}</p>
              <a
                href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors"
              >
                {t("viewOnGoogle")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
