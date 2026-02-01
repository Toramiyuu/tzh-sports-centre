"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Clock,
  ChevronRight,
  Calendar,
  Award,
  Zap,
  Target,
  Sparkles,
  MapPin,
  Phone,
  Wrench,
  Star,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// ============================================
// HERO SECTION — Premium Light Design
// ============================================
function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative bg-gradient-to-br from-white via-slate-50 to-teal-50/30 px-4 sm:px-6 lg:px-8 py-20 md:py-28 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="mx-auto max-w-6xl relative">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left: Content */}
          <div className="text-center md:text-left">
            {/* Social proof badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 mb-8 shadow-sm">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {t("hero.socialProof")}
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up-delay-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              {t("hero.headline")}
            </h1>

            {/* Sub-headline */}
            <p className="animate-fade-in-up-delay-2 text-lg sm:text-xl text-slate-500 mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
              {t("hero.subheadline")}
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up-delay-2 flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-12">
              <Link href="/booking">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 btn-press cursor-pointer"
                >
                  {t("hero.bookCourt")}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/lessons">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base border-2 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t("hero.viewLessons")}
                </Button>
              </Link>
            </div>

            {/* Key stats row */}
            <div className="animate-fade-in-up-delay-3 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-teal-600" />
                </div>
                <span className="font-medium text-slate-700">
                  {t("hero.stat.courts")}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-medium text-slate-700">
                  {t("hero.stat.price")}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">
                  {t("hero.stat.hours")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Hero image */}
          <div className="relative hidden md:block">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <Image
                src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"
                alt="Badminton court"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// AVAILABLE SPORTS SECTION
// ============================================
function AvailableSportsSection() {
  const t = useTranslations("home.availableSports");

  const sports = [
    {
      name: t("badminton.name"),
      courts: t("badminton.courts"),
      price: t("badminton.price"),
      image:
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80",
      link: "/booking",
    },
    {
      name: t("pickleball.name"),
      courts: t("pickleball.courts"),
      price: t("pickleball.price"),
      image: "/images/pickleball.png",
      link: "/booking?sport=pickleball",
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sports.map((sport, i) => (
            <Link
              key={i}
              href={sport.link}
              className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[16/10] relative">
                <Image
                  src={sport.image}
                  alt={sport.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{sport.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    {sport.courts}
                  </span>
                  <span className="text-lg font-semibold">{sport.price}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING SNAPSHOT SECTION
// ============================================
function PricingSnapshotSection() {
  const t = useTranslations("home.pricing");

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {/* Badminton */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-900">
                {t("badminton.title")}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t("badminton.offPeak")}</span>
                <span className="font-semibold text-slate-900">RM15/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t("badminton.peak")}</span>
                <span className="font-semibold text-slate-900">RM18/hr</span>
              </div>
            </div>
          </div>

          {/* Pickleball */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">
                {t("pickleball.title")}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t("pickleball.rate")}</span>
                <span className="font-semibold text-slate-900">RM25/hr</span>
              </div>
              <p className="text-xs text-slate-400">
                {t("pickleball.minimum")}
              </p>
            </div>
          </div>

          {/* Coaching */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900">
                {t("coaching.title")}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t("coaching.from")}</span>
                <span className="font-semibold text-slate-900">RM130</span>
              </div>
              <p className="text-xs text-slate-400">{t("coaching.note")}</p>
            </div>
          </div>
        </div>

        {/* No hidden fees + Operating hours */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-500 border-t border-slate-100 pt-6">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            {t("noHiddenFees")}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {t("hours.weekdays")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {t("hours.weekends")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// WHAT WE OFFER SECTION
// ============================================
function WhatWeOfferSection() {
  const t = useTranslations("home.services");

  const services = [
    {
      icon: Calendar,
      titleKey: "badminton.title",
      descKey: "badminton.desc",
      link: "/booking",
      color: "teal",
    },
    {
      icon: Zap,
      titleKey: "pickleball.title",
      descKey: "pickleball.desc",
      link: "/booking?sport=pickleball",
      color: "amber",
    },
    {
      icon: Award,
      titleKey: "coaching.title",
      descKey: "coaching.desc",
      link: "/lessons",
      color: "emerald",
    },
  ];

  const colorClasses: Record<
    string,
    { bg: string; icon: string; hover: string }
  > = {
    teal: {
      bg: "bg-teal-50",
      icon: "text-teal-600",
      hover: "hover:border-teal-200 hover:shadow-teal-100/50",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      hover: "hover:border-amber-200 hover:shadow-amber-100/50",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      hover: "hover:border-emerald-200 hover:shadow-emerald-100/50",
    },
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {t("title")}
          </h2>
          <p className="text-slate-500">{t("subtitle")}</p>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {services.map((service, i) => {
            const colors = colorClasses[service.color];
            return (
              <Link
                key={i}
                href={service.link}
                className={`group block bg-white border border-slate-100 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg ${colors.hover}`}
              >
                <div
                  className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <service.icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t(service.titleKey)}
                </h3>
                <p className="text-slate-500 text-sm">
                  {t(service.descKey)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// WHY CHOOSE US — 4 Value Propositions
// ============================================
function WhyChooseUsSection() {
  const t = useTranslations("home.whyChooseUs");

  const valueProps = [
    {
      icon: Target,
      titleKey: "dualSport.title",
      descKey: "dualSport.desc",
      badgeKey: "dualSport.badge",
      accent: "teal" as const,
    },
    {
      icon: Calendar,
      titleKey: "bookOnline.title",
      descKey: "bookOnline.desc",
      badgeKey: null,
      accent: "amber" as const,
    },
    {
      icon: Award,
      titleKey: "playerServices.title",
      descKey: "playerServices.desc",
      badgeKey: null,
      accent: "teal" as const,
    },
    {
      icon: Sparkles,
      titleKey: "facilities.title",
      descKey: "facilities.desc",
      badgeKey: "facilities.badge",
      accent: "amber" as const,
    },
  ];

  const accentClasses = {
    teal: { bg: "bg-teal-100", icon: "text-teal-600", badge: "bg-teal-100 text-teal-700" },
    amber: { bg: "bg-amber-100", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            {t("title")}
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {valueProps.map((prop, i) => {
            const colors = accentClasses[prop.accent];
            return (
              <div
                key={i}
                className="relative bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
              >
                {prop.badgeKey && (
                  <span
                    className={`absolute top-6 right-6 text-xs font-medium px-3 py-1 rounded-full ${colors.badge}`}
                  >
                    {t(prop.badgeKey)}
                  </span>
                )}
                <div
                  className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-5`}
                >
                  <prop.icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t(prop.titleKey)}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {t(prop.descKey)}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/booking">
            <Button
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 btn-press cursor-pointer"
            >
              {t("cta")}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// GOOGLE REVIEWS SECTION
// ============================================
function GoogleReviewsSection() {
  const t = useTranslations("home.googleReviews");

  const reviews = [
    {
      name: "Ying Jie Teoh",
      rating: 5,
      text: t("review1"),
      timeAgo: t("review1Time"),
    },
    {
      name: "Chin Aik Teh",
      rating: 5,
      text: t("review2"),
      timeAgo: t("review2Time"),
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            {t("title")}
          </h2>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-slate-900">4.7</span>
          </div>
          <p className="text-slate-500 text-sm">{t("subtitle")}</p>
        </div>

        {/* Desktop: grid, Mobile: horizontal scroll */}
        <div className="hidden md:grid grid-cols-2 gap-6 mb-8">
          {reviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>
        <div className="md:hidden flex flex-col gap-4 mb-8">
          {reviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
          >
            {t("viewOnGoogle")}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({
  review,
}: {
  review: { name: string; rating: number; text: string; timeAgo: string };
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
          <p className="text-xs text-slate-400">{review.timeAgo}</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
          />
        ))}
      </div>
      {review.text && (
        <p className="text-slate-600 text-sm">{review.text}</p>
      )}
    </div>
  );
}

// ============================================
// STRINGING PROMO SECTION
// ============================================
function StringingPromoSection() {
  const t = useTranslations("home.stringingPromo");

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench className="w-7 h-7 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{t("title")}</h2>
            <p className="text-slate-400 text-sm md:text-base mt-1">
              {t("description")}
            </p>
          </div>
        </div>
        <Link
          href="/stringing"
          className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          {t("cta")}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ============================================
// WHERE TO FIND US SECTION
// ============================================
function LocationSection() {
  const t = useTranslations("home.location");

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-md h-64 md:h-80">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1986.0259229585!2d100.29758!3d5.4090748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac300162c75fd%3A0x65461617c304bf30!2sTZH%20Badminton%20Academy!5e0!3m2!1sen!2smy!4v1705000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center space-y-6">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {t("address.title")}
                </h3>
                <p className="text-slate-500 text-sm">{t("address.line1")}</p>
                <p className="text-slate-500 text-sm">{t("address.line2")}</p>
                <a
                  href="https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 text-sm font-medium hover:underline mt-2 inline-block"
                >
                  {t("address.directions")} →
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {t("hours.title")}
                </h3>
                <p className="text-slate-500 text-sm">{t("hours.weekdays")}</p>
                <p className="text-slate-500 text-sm">{t("hours.weekends")}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {t("contact.title")}
                </h3>
                <p className="text-slate-500 text-sm">
                  {t("contact.bookingsLabel")}{" "}
                  <a
                    href="tel:+60116868508"
                    className="text-teal-600 hover:underline"
                  >
                    011-6868 8508
                  </a>
                </p>
                <p className="text-slate-500 text-sm">
                  {t("contact.lessonsLabel")}{" "}
                  <a
                    href="tel:+60117575508"
                    className="text-teal-600 hover:underline"
                  >
                    011-7575 8508
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <HeroSection />
      <AvailableSportsSection />
      <PricingSnapshotSection />
      <WhatWeOfferSection />
      <WhyChooseUsSection />
      <GoogleReviewsSection />
      <StringingPromoSection />
      <LocationSection />
    </div>
  );
}
