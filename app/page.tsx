"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Clock,
  ChevronRight,
  Calendar,
  Award,
  Zap,
  Wind,
  Lightbulb,
  Target,
  Sparkles,
  Coffee,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// ============================================
// HERO SECTION (unchanged)
// ============================================
function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-16 md:py-24 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="mx-auto max-w-7xl relative">
        <div className="grid items-center gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-100">
                {t("hero.subtitle")}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              {t("hero.title")}
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0">
              {t("hero.description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/booking">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/20"
                >
                  {t("hero.bookCourt")}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/lessons">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {t("hero.viewLessons")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Image + Info Cards */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"
                alt="Badminton court"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
            </div>

            {/* Floating Info Cards */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("pricing.from")}</p>
                  <p className="text-xl font-bold text-gray-900">RM15/hr</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("pricing.openDaily")}</p>
                  <p className="text-lg font-bold text-gray-900">{t("pricing.courts")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Info */}
        <div className="grid grid-cols-3 gap-4 mt-12 lg:hidden">
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-blue-200">{t("pricing.courtsLabel")}</p>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-2xl font-bold">RM15</p>
            <p className="text-xs text-blue-200">{t("pricing.perHour")}</p>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-2xl font-bold">3PM</p>
            <p className="text-xs text-blue-200">{t("pricing.weekdaysStart")}</p>
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
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80",
      link: "/booking",
      color: "blue",
    },
    {
      name: t("pickleball.name"),
      courts: t("pickleball.courts"),
      price: t("pickleball.price"),
      image: "/images/pickleball.png",
      link: "/booking?sport=pickleball",
      color: "orange",
    },
  ];

  return (
    <section className="px-4 py-12 md:py-16 bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
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
    <section className="px-4 py-12 md:py-16 bg-white">
      <div className="mx-auto max-w-5xl">
        {/* Pricing Cards */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {/* Badminton */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{t("badminton.title")}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("badminton.offPeak")}</span>
                <span className="font-semibold text-gray-900">RM15/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("badminton.peak")}</span>
                <span className="font-semibold text-gray-900">RM18/hr</span>
              </div>
            </div>
          </div>

          {/* Pickleball */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{t("pickleball.title")}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("pickleball.rate")}</span>
                <span className="font-semibold text-gray-900">RM25/hr</span>
              </div>
              <p className="text-xs text-gray-500">{t("pickleball.minimum")}</p>
            </div>
          </div>

          {/* Coaching */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{t("coaching.title")}</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("coaching.from")}</span>
                <span className="font-semibold text-gray-900">RM130</span>
              </div>
              <p className="text-xs text-gray-500">{t("coaching.note")}</p>
            </div>
          </div>
        </div>

        {/* No hidden fees + Operating hours */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600 border-t border-gray-100 pt-6">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            {t("noHiddenFees")}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {t("hours.weekdays")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {t("hours.weekends")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// WHAT WE OFFER SECTION (3 cards only)
// ============================================
function WhatWeOfferSection() {
  const t = useTranslations("home.services");

  const services = [
    {
      icon: Calendar,
      titleKey: "badminton.title",
      descKey: "badminton.desc",
      link: "/booking",
      color: "blue",
    },
    {
      icon: Zap,
      titleKey: "pickleball.title",
      descKey: "pickleball.desc",
      link: "/booking?sport=pickleball",
      color: "orange",
    },
    {
      icon: Award,
      titleKey: "coaching.title",
      descKey: "coaching.desc",
      link: "/lessons",
      color: "green",
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; hover: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", hover: "hover:border-blue-200 hover:shadow-blue-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", hover: "hover:border-orange-200 hover:shadow-orange-100" },
    green: { bg: "bg-green-50", icon: "text-green-600", hover: "hover:border-green-200 hover:shadow-green-100" },
  };

  return (
    <section className="px-4 py-12 md:py-16 bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h2>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {services.map((service, i) => {
            const colors = colorClasses[service.color];
            return (
              <Link
                key={i}
                href={service.link}
                className={`group block bg-white border border-gray-100 rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${colors.hover}`}
              >
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <service.icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t(service.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm">{t(service.descKey)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// WHY CHOOSE US SECTION (6 factual points)
// ============================================
function WhyChooseUsSection() {
  const t = useTranslations("home.whyChooseUs");

  const reasons = [
    { icon: Sparkles, titleKey: "clean.title", descKey: "clean.desc" },
    { icon: Wind, titleKey: "ventilation.title", descKey: "ventilation.desc" },
    { icon: Lightbulb, titleKey: "lighting.title", descKey: "lighting.desc" },
    { icon: Target, titleKey: "nets.title", descKey: "nets.desc" },
    { icon: Sparkles, titleKey: "tidy.title", descKey: "tidy.desc" },
    { icon: Coffee, titleKey: "snacks.title", descKey: "snacks.desc" },
  ];

  return (
    <section className="px-4 py-12 md:py-16 bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <reason.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t(reason.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm">{t(reason.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link href="/booking">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
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
// WHERE TO FIND US SECTION
// ============================================
function LocationSection() {
  const t = useTranslations("home.location");

  return (
    <section className="px-4 py-12 md:py-16 bg-gray-50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Map */}
          <div className="rounded-xl overflow-hidden shadow-md h-64 md:h-80">
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t("address.title")}</h3>
                <p className="text-gray-600 text-sm">{t("address.line1")}</p>
                <p className="text-gray-600 text-sm">{t("address.line2")}</p>
                <a
                  href="https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block"
                >
                  {t("address.directions")} →
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t("hours.title")}</h3>
                <p className="text-gray-600 text-sm">{t("hours.weekdays")}</p>
                <p className="text-gray-600 text-sm">{t("hours.weekends")}</p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t("contact.title")}</h3>
                <p className="text-gray-600 text-sm">{t("contact.bookings")}</p>
                <p className="text-gray-600 text-sm">{t("contact.lessons")}</p>
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
      <LocationSection />
    </div>
  );
}
