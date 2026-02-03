"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Clock,
  ChevronRight,
  ChevronDown,
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
  Quote,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// ============================================
// HERO SECTION — Full-bleed Premium Dark
// ============================================
function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* TODO: Replace with real TZH hero photo */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Sports facility"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white uppercase tracking-tight leading-none mb-8 animate-fade-in-up">
          <span className="block">Two Sports.</span>
          <span className="block">One Tap.</span>
          <span className="block text-amber-400">Game On.</span>
        </h1>

        {/* Stats Bar */}
        <div className="animate-fade-in-up-delay-1 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-white/80 text-sm sm:text-base mb-10">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <span>{t("hero.stat.courts")}</span>
          </div>
          <span className="hidden sm:block w-px h-5 bg-white/30" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>{t("hero.stat.price")}</span>
          </div>
          <span className="hidden sm:block w-px h-5 bg-white/30" />
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>{t("hero.stat.hours")}</span>
          </div>
          <span className="hidden sm:block w-px h-5 bg-white/30" />
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span>4.7 Google</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up-delay-2 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/booking">
            <Button
              size="lg"
              className="h-14 px-10 text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white uppercase tracking-wider font-semibold shadow-lg shadow-amber-500/25 btn-press cursor-pointer"
            >
              {t("hero.bookCourt")}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/lessons">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-base border-2 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white uppercase tracking-wider font-semibold cursor-pointer"
            >
              {t("hero.viewLessons")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-down">
        <ChevronDown className="w-8 h-8 text-white/50" />
      </div>
    </section>
  );
}

// ============================================
// SPORTS SECTION — Full-width Split
// ============================================
function SportsSection() {
  const t = useTranslations("home.availableSports");

  const sports = [
    {
      name: t("badminton.name"),
      courts: t("badminton.courts"),
      price: t("badminton.price"),
      image: "/images/badminton-action.jpg",
      link: "/booking",
    },
    {
      name: t("pickleball.name"),
      courts: t("pickleball.courts"),
      price: t("pickleball.price"),
      image: "/images/pickleball.jpg",
      link: "/booking?sport=pickleball",
    },
  ];

  return (
    <section className="bg-slate-900">
      <div className="grid md:grid-cols-2">
        {sports.map((sport, i) => (
          <Link
            key={i}
            href={sport.link}
            className="group relative h-[50vh] md:h-[60vh] overflow-hidden"
          >
            {/* TODO: Replace with real TZH sport photos */}
            <Image
              src={sport.image}
              alt={sport.name}
              fill
              className="object-cover img-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 transition-all duration-300" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
              <h3 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight mb-4">
                {sport.name}
              </h3>
              <p className="text-white/70 text-lg mb-4">{sport.courts}</p>
              <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {sport.price}
              </span>
            </div>

            {/* Hover Arrow */}
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================
// PRICING SECTION — Dark Minimal
// ============================================
function PricingSection() {
  const t = useTranslations("home.pricing");

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28 bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tight mb-4">
            Simple Pricing
          </h2>
          <p className="text-slate-400">No hidden fees. Pay as you play.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Badminton */}
          <div className="text-center p-8 border border-slate-700 rounded-2xl hover:border-amber-500/50 transition-colors">
            <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-7 w-7 text-amber-400" />
            </div>
            <h3 className="font-display text-2xl text-white uppercase tracking-tight mb-6">
              {t("badminton.title")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{t("badminton.offPeak")}</span>
                <span className="text-2xl font-bold text-white">RM15<span className="text-sm font-normal text-slate-500">/hr</span></span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{t("badminton.peak")}</span>
                <span className="text-2xl font-bold text-white">RM18<span className="text-sm font-normal text-slate-500">/hr</span></span>
              </div>
            </div>
          </div>

          {/* Pickleball */}
          <div className="text-center p-8 border border-slate-700 rounded-2xl hover:border-amber-500/50 transition-colors">
            <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Zap className="h-7 w-7 text-orange-400" />
            </div>
            <h3 className="font-display text-2xl text-white uppercase tracking-tight mb-6">
              {t("pickleball.title")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{t("pickleball.rate")}</span>
                <span className="text-2xl font-bold text-white">RM25<span className="text-sm font-normal text-slate-500">/hr</span></span>
              </div>
              <p className="text-xs text-slate-600 pt-2">
                {t("pickleball.minimum")}
              </p>
            </div>
          </div>

          {/* Coaching */}
          <div className="text-center p-8 border border-slate-700 rounded-2xl hover:border-amber-500/50 transition-colors">
            <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Award className="h-7 w-7 text-amber-400" />
            </div>
            <h3 className="font-display text-2xl text-white uppercase tracking-tight mb-6">
              {t("coaching.title")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{t("coaching.from")}</span>
                <span className="text-2xl font-bold text-white">RM130</span>
              </div>
              <p className="text-xs text-slate-600 pt-2">{t("coaching.note")}</p>
            </div>
          </div>
        </div>

        {/* Hours info */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-sm text-slate-500 border-t border-slate-700 pt-8">
          <span className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            {t("hours.weekdays")}
          </span>
          <span className="hidden sm:block">•</span>
          <span className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            {t("hours.weekends")}
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================
// WHY CHOOSE US — Dark Cards
// ============================================
function WhyChooseUsSection() {
  const t = useTranslations("home.whyChooseUs");

  const valueProps = [
    {
      icon: Target,
      titleKey: "dualSport.title",
      descKey: "dualSport.desc",
      badgeKey: "dualSport.badge",
    },
    {
      icon: Calendar,
      titleKey: "bookOnline.title",
      descKey: "bookOnline.desc",
      badgeKey: null,
    },
    {
      icon: Award,
      titleKey: "playerServices.title",
      descKey: "playerServices.desc",
      badgeKey: null,
    },
    {
      icon: Sparkles,
      titleKey: "facilities.title",
      descKey: "facilities.desc",
      badgeKey: "facilities.badge",
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28 bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {valueProps.map((prop, i) => (
            <div
              key={i}
              className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-300 group"
            >
              {prop.badgeKey && (
                <span className="absolute top-6 right-6 text-xs font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {t(prop.badgeKey)}
                </span>
              )}
              <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                <prop.icon className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {t(prop.titleKey)}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t(prop.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/booking">
            <Button
              size="lg"
              className="h-14 px-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white uppercase tracking-wider font-semibold shadow-lg shadow-amber-500/25 btn-press cursor-pointer"
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
// GOOGLE REVIEWS — Dark with Large Quote
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
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28 bg-slate-950">
      <div className="mx-auto max-w-6xl">
        {/* Rating Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-6 h-6 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <span className="text-4xl font-bold text-white">4.7</span>
          </div>
          <p className="text-slate-400">{t("subtitle")}</p>
        </div>

        {/* Featured Quote */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 md:p-12">
            <Quote className="absolute top-6 left-6 w-12 h-12 text-amber-500/20" />
            <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-6 relative z-10">
              "{reviews[0].text}"
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {reviews[0].name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{reviews[0].name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-slate-500 text-sm">{reviews[0].timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Review */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-300 mb-4">"{reviews[1].text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                {reviews[1].name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-white text-sm">{reviews[1].name}</p>
                <p className="text-slate-500 text-xs">{reviews[1].timeAgo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Google Link */}
        <div className="text-center">
          <a
            href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            {t("viewOnGoogle")}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================
// STRINGING PROMO — Full-width Dark with Image
// ============================================
function StringingPromoSection() {
  const t = useTranslations("home.stringingPromo");

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* TODO: Replace with real TZH stringing photo */}
      <div className="absolute inset-0">
        <Image
          src="/images/strings-bg.jpg"
          alt="Racket stringing"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Wrench className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tight mb-4">
          {t("title")}
        </h2>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
          {t("description")}
        </p>
        <Link href="/stringing">
          <Button
            size="lg"
            className="h-14 px-10 bg-white text-black hover:bg-zinc-100 uppercase tracking-wider font-semibold cursor-pointer"
          >
            {t("cta")}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ============================================
// LOCATION SECTION — Dark with Split Layout
// ============================================
function LocationSection() {
  const t = useTranslations("home.location");

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28 bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tight mb-4">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden h-80 md:h-96 border border-slate-700">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1986.0259229585!2d100.29758!3d5.4090748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac300162c75fd%3A0x65461617c304bf30!2sTZH%20Badminton%20Academy!5e0!3m2!1sen!2smy!4v1705000000000"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  {t("address.title")}
                </h3>
                <p className="text-slate-400 text-sm">{t("address.line1")}</p>
                <p className="text-slate-400 text-sm">{t("address.line2")}</p>
                <a
                  href="https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 text-sm font-medium hover:text-amber-300 mt-2 inline-flex items-center gap-1 transition-colors"
                >
                  {t("address.directions")}
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  {t("hours.title")}
                </h3>
                <p className="text-slate-400 text-sm">{t("hours.weekdays")}</p>
                <p className="text-slate-400 text-sm">{t("hours.weekends")}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  {t("contact.title")}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t("contact.bookingsLabel")}{" "}
                  <a
                    href="tel:+60116868508"
                    className="text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    011-6868 8508
                  </a>
                </p>
                <p className="text-slate-400 text-sm">
                  {t("contact.lessonsLabel")}{" "}
                  <a
                    href="tel:+60117575508"
                    className="text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    011-7575 8508
                  </a>
                </p>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/60116868508?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20court%20booking"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Us
            </a>
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
    <div className="flex min-h-screen flex-col bg-slate-900 font-sans">
      <HeroSection />
      <SportsSection />
      <PricingSection />
      <WhyChooseUsSection />
      <GoogleReviewsSection />
      <StringingPromoSection />
      <LocationSection />
    </div>
  );
}
