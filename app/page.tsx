"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// ============================================
// HERO — Editorial, image-forward
// ============================================
function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-900 leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
            {t("hero.headline")}
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 font-normal leading-relaxed mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-forwards">
            {t("hero.subheadline")}
          </p>
          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
            <Link href="/booking">
              <Button className="h-12 px-6 text-base font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-full">
                {t("hero.bookCourt")}
              </Button>
            </Link>
            <Link href="/lessons">
              <Button
                variant="ghost"
                className="h-12 px-6 text-base font-medium text-neutral-900 hover:bg-neutral-100 rounded-full"
              >
                {t("hero.viewLessons")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Image - full width, no overlay */}
      <div className="mt-16 md:mt-24 animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-forwards">
        <div className="max-w-7xl mx-auto px-6">
          {/* TODO: Replace with real TZH facility photo */}
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-neutral-100">
            <Image
              src="/images/hero-bg.jpg"
              alt="TZH Sports Centre"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// STATS — Simple row of numbers
// ============================================
function StatsSection() {
  const t = useTranslations("home");

  const stats = [
    { value: "4", label: t("hero.stat.courts") },
    { value: "RM15", label: "Starting price per hour" },
    { value: "4.7", label: "Google rating" },
    { value: "12AM", label: "Open until" },
  ];

  return (
    <section className="py-16 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SPORTS — Asymmetric two-column
// ============================================
function SportsSection() {
  const t = useTranslations("home.availableSports");

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Badminton */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center mb-24 md:mb-32">
          <div className="order-2 md:order-1 animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">
              {t("badminton.courts")}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
              {t("badminton.name")}
            </h2>
            <p className="text-lg text-neutral-500 leading-relaxed mb-6">
              Professional courts with quality flooring and lighting. Perfect for casual games or serious training.
            </p>
            <p className="text-2xl font-semibold text-neutral-900 mb-8">
              {t("badminton.price")}
            </p>
            <Link href="/booking">
              <Button
                variant="outline"
                className="h-11 px-6 text-sm font-medium rounded-full border-neutral-300 hover:border-neutral-900 hover:bg-transparent"
              >
                Book badminton court
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="order-1 md:order-2 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            {/* TODO: Replace with real TZH badminton photo */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100">
              <Image
                src="/images/badminton-action.jpg"
                alt="Badminton court"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>

        {/* Pickleball */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 delay-200 fill-mode-forwards">
            {/* TODO: Replace with real TZH pickleball photo */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100">
              <Image
                src="/images/pickleball.jpg"
                alt="Pickleball court"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-200 fill-mode-forwards">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">
              {t("pickleball.courts")}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
              {t("pickleball.name")}
            </h2>
            <p className="text-lg text-neutral-500 leading-relaxed mb-6">
              The fastest-growing sport in the world, now in Ayer Itam. Paddles and balls available for rent.
            </p>
            <p className="text-2xl font-semibold text-neutral-900 mb-8">
              {t("pickleball.price")}
            </p>
            <Link href="/booking?sport=pickleball">
              <Button
                variant="outline"
                className="h-11 px-6 text-sm font-medium rounded-full border-neutral-300 hover:border-neutral-900 hover:bg-transparent"
              >
                Book pickleball court
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING — Clean table layout
// ============================================
function PricingSection() {
  const t = useTranslations("home.pricing");

  return (
    <section className="py-24 md:py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-neutral-500">
            {t("noHiddenFees")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Badminton */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-200 hover-lift animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">
              {t("badminton.title")}
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500">{t("badminton.offPeak")}</span>
                <span className="text-2xl font-semibold text-neutral-900">RM15<span className="text-base font-normal text-neutral-400">/hr</span></span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500">{t("badminton.peak")}</span>
                <span className="text-2xl font-semibold text-neutral-900">RM18<span className="text-base font-normal text-neutral-400">/hr</span></span>
              </div>
            </div>
            <Link href="/booking" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 inline-flex items-center">
              Book now <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Pickleball */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-200 hover-lift animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-forwards">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">
              {t("pickleball.title")}
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500">{t("pickleball.rate")}</span>
                <span className="text-2xl font-semibold text-neutral-900">RM25<span className="text-base font-normal text-neutral-400">/hr</span></span>
              </div>
              <p className="text-sm text-neutral-400">{t("pickleball.minimum")}</p>
            </div>
            <Link href="/booking?sport=pickleball" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 inline-flex items-center">
              Book now <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Coaching */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-200 hover-lift animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-forwards">
            <h3 className="text-lg font-semibold text-neutral-900 mb-6">
              {t("coaching.title")}
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-neutral-500">{t("coaching.from")}</span>
                <span className="text-2xl font-semibold text-neutral-900">RM130</span>
              </div>
              <p className="text-sm text-neutral-400">{t("coaching.note")}</p>
            </div>
            <Link href="/lessons" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 inline-flex items-center">
              View lessons <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-8 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t("hours.weekdays")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t("hours.weekends")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES — Simple list, no cards
// ============================================
function FeaturesSection() {
  const t = useTranslations("home.whyChooseUs");

  const features = [
    { title: t("dualSport.title"), desc: t("dualSport.desc") },
    { title: t("bookOnline.title"), desc: t("bookOnline.desc") },
    { title: t("playerServices.title"), desc: t("playerServices.desc") },
    { title: t("facilities.title"), desc: t("facilities.desc") },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
              {t("title")}
            </h2>
            <p className="text-lg text-neutral-500 mb-8">
              {t("subtitle")}
            </p>
            <Link href="/booking">
              <Button className="h-11 px-6 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-full">
                {t("cta")}
              </Button>
            </Link>
          </div>
          <div className="space-y-10">
            {features.map((feature, i) => (
              <div
                key={i}
                className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-forwards"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// REVIEWS — Minimal, quote-focused
// ============================================
function ReviewsSection() {
  const t = useTranslations("home.googleReviews");

  return (
    <section className="py-24 md:py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center animate-in fade-in duration-1000 fill-mode-forwards">
          <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-6">
            {t("subtitle")}
          </p>
          <blockquote className="text-2xl md:text-3xl font-medium text-neutral-900 leading-relaxed mb-8">
            "{t("review1")}"
          </blockquote>
          <div className="text-neutral-500">
            <span className="font-medium text-neutral-900">Ying Jie Teoh</span>
            <span className="mx-2">·</span>
            <span>{t("review1Time")}</span>
          </div>
        </div>

        <div className="mt-16 text-center animate-in fade-in duration-700 delay-300 fill-mode-forwards">
          <a
            href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-900 hover:text-neutral-600 inline-flex items-center"
          >
            {t("viewOnGoogle")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================
// STRINGING — Image with text beside
// ============================================
function StringingSection() {
  const t = useTranslations("home.stringingPromo");

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            {/* TODO: Replace with real TZH stringing photo */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100">
              <Image
                src="/images/strings-bg.jpg"
                alt="Racket stringing"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4">
              Professional service
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
              {t("title")}
            </h2>
            <p className="text-lg text-neutral-500 leading-relaxed mb-8">
              {t("description")}
            </p>
            <Link href="/stringing">
              <Button
                variant="outline"
                className="h-11 px-6 text-sm font-medium rounded-full border-neutral-300 hover:border-neutral-900 hover:bg-transparent"
              >
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// LOCATION — Clean two-column
// ============================================
function LocationSection() {
  const t = useTranslations("home.location");

  return (
    <section className="py-24 md:py-32 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <h2 className="text-3xl md:text-4xl font-semibold mb-8">
              {t("title")}
            </h2>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-neutral-400" />
                  <h3 className="font-medium">{t("address.title")}</h3>
                </div>
                <p className="text-neutral-400 ml-8">
                  {t("address.line1")}<br />
                  {t("address.line2")}
                </p>
                <a
                  href="https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-white hover:text-neutral-300 ml-8 mt-2 inline-flex items-center"
                >
                  {t("address.directions")} <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-neutral-400" />
                  <h3 className="font-medium">{t("hours.title")}</h3>
                </div>
                <p className="text-neutral-400 ml-8">
                  {t("hours.weekdays")}<br />
                  {t("hours.weekends")}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-5 w-5 text-neutral-400" />
                  <h3 className="font-medium">{t("contact.title")}</h3>
                </div>
                <p className="text-neutral-400 ml-8">
                  {t("contact.bookingsLabel")} <a href="tel:+60116868508" className="text-white hover:text-neutral-300">011-6868 8508</a><br />
                  {t("contact.lessonsLabel")} <a href="tel:+60117575508" className="text-white hover:text-neutral-300">011-7575 8508</a>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden h-80 md:h-auto animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1986.0259229585!2d100.29758!3d5.4090748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac300162c75fd%3A0x65461617c304bf30!2sTZH%20Badminton%20Academy!5e0!3m2!1sen!2smy!4v1705000000000"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "320px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
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
    <div className="min-h-screen bg-white">
      <HeroSection />
      <StatsSection />
      <SportsSection />
      <PricingSection />
      <FeaturesSection />
      <ReviewsSection />
      <StringingSection />
      <LocationSection />
    </div>
  );
}
