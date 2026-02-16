"use client";

import { ArrowRight, Quote, Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function ReviewsSection() {
  const t = useTranslations("home.googleReviews");

  const reviews = [
    {
      text: "So hot but fun as hell! The courts are well-maintained and the booking system is super convenient. Love that it's open till midnight.",
      author: "Ying Jie Teoh",
      time: t("review1Time"),
      stars: 5,
    },
    {
      text: "Best badminton courts in Ayer Itam. Clean courts, good lighting with no glare, and the prices are very reasonable.",
      author: "Wei Liang C.",
      time: "3 weeks ago",
      stars: 5,
    },
    {
      text: "Tried pickleball here for the first time — great experience. Paddles available for rent and the staff are friendly. Easy online booking too.",
      author: "Sarah L.",
      time: "a month ago",
      stars: 5,
    },
    {
      text: "Good facility with quality flooring. The coaching sessions are worth it — Coach is patient and knowledgeable. Racket stringing service is a nice bonus.",
      author: "Marcus T.",
      time: "2 months ago",
      stars: 4,
    },
  ];

  return (
    <section className="py-16 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t("subtitle")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
            {t("sectionTitle")}
          </h2>
        </div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {/* Google Rating Summary Card */}
          <div className="break-inside-avoid rounded-2xl bg-primary p-8 text-white animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <div className="text-3xl font-bold">4.7</div>
                <div className="text-white/70 text-sm">{t("googleRating")}</div>
              </div>
            </div>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className={`h-5 w-5 ${j < 5 ? "fill-white text-white" : "fill-white/30 text-white/30"}`} />
              ))}
            </div>
            <p className="text-white/80 text-sm mb-5">{t("basedOn")}</p>
            <a
              href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors"
            >
              {t("viewOnGoogle")} <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Review Cards */}
          {reviews.map((review, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-2xl bg-card border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/20 mb-3" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < review.stars ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
                  />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-foreground text-sm leading-relaxed mb-5">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{review.author[0]}</span>
                </div>
                <div>
                  <span className="text-foreground text-sm font-semibold">{review.author}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Google</span>
                    <span className="text-muted-foreground text-xs">{review.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

