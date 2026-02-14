"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowRight, Star, Trophy, Wrench, GraduationCap, Zap } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// ============================================
// HERO — Full-viewport background image, centered (Lucky Hole style)
// ============================================
function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="TZH Sports Centre"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content — centered */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-8 animate-in fade-in duration-700 fill-mode-forwards">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/80">Open now until 12:00 AM</span>
        </div>

        <p className="text-sm font-medium text-white/70 uppercase tracking-[0.2em] mb-6 animate-in fade-in duration-700 delay-100 fill-mode-forwards">
          Ayer Itam, Penang
        </p>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-6 animate-in fade-in duration-700 delay-200 fill-mode-forwards">
          {t("hero.headline")}
        </h1>

        <p className="text-lg md:text-xl text-white/70 uppercase tracking-[0.15em] mb-4 animate-in fade-in duration-700 delay-300 fill-mode-forwards">
          Badminton &amp; Pickleball
        </p>

        <p className="text-base text-white/60 mb-10 max-w-lg mx-auto animate-in fade-in duration-700 delay-400 fill-mode-forwards">
          {t("hero.subheadline")}
        </p>

        <div className="flex flex-wrap justify-center gap-4 animate-in fade-in duration-700 delay-500 fill-mode-forwards">
          <Link href="/booking">
            <Button className="h-12 px-8 text-sm font-medium uppercase tracking-wider bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-sm">
              {t("hero.bookCourt")}
            </Button>
          </Link>
          <Link href="/lessons">
            <Button
              variant="outline"
              className="h-12 px-8 text-sm font-medium uppercase tracking-wider border-white/40 text-white bg-transparent hover:bg-white/10 dark:bg-transparent dark:hover:bg-white/10 rounded-sm"
            >
              {t("hero.viewLessons")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-in fade-in duration-700 delay-700 fill-mode-forwards">
        <span className="text-xs text-white/50 uppercase tracking-[0.2em]">Scroll</span>
        <div className="w-px h-8 bg-white/30" />
      </div>
    </section>
  );
}

// ============================================
// ABOUT — Image with accent + feature cards + stat cards
// ============================================
function AboutSection() {
  const t = useTranslations("home");

  const features = [
    {
      icon: Trophy,
      title: "Professional Courts",
      description: "4 courts with quality vinyl flooring and side-mounted lighting with zero glare.",
    },
    {
      icon: Wrench,
      title: "Racket Stringing",
      description: "On-site stringing service with 18+ string options. Same-day turnaround available.",
    },
    {
      icon: GraduationCap,
      title: "Expert Coaching",
      description: "BAM-certified coaches for all levels. Private and group sessions available.",
    },
  ];

  const stats = [
    { icon: Trophy, value: "4", label: t("hero.stat.courts") },
    { icon: Star, value: "4.7", label: "Google Rating" },
    { icon: Zap, value: "RM15", label: "From / Hour" },
    { icon: Clock, value: "12AM", label: "Open Until" },
  ];

  return (
    <section className="py-28 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in duration-700 fill-mode-forwards">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.2em] mb-4">
            Our Courts
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Built for Players
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ayer Itam&apos;s home for badminton and pickleball — book online, show up, and play.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image with decorative accent */}
          <div className="relative animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <div className="absolute -inset-4 bg-primary/10 rounded-2xl -rotate-2" />
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/images/facility-interior.jpg"
                alt="TZH Sports Centre courts"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs uppercase tracking-[0.1em] text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SPORTS — Interactive showcase cards
// ============================================
function SportsSection() {
  const t = useTranslations("home.availableSports");

  const sports = [
    {
      name: t("badminton.name"),
      courts: t("badminton.courts"),
      price: t("badminton.price"),
      image: "/images/badminton-action.jpg",
      href: "/booking",
      description: "Professional courts with quality flooring and lighting. Perfect for casual games or serious training.",
      highlights: ["Vinyl Flooring", "Zero-Glare Lighting", "Walk-ins Welcome"],
    },
    {
      name: t("pickleball.name"),
      courts: t("pickleball.courts"),
      price: t("pickleball.price"),
      image: "/images/pickleball.jpg",
      href: "/booking?sport=pickleball",
      description: "The fastest-growing sport in the world, now in Ayer Itam. Paddles and balls available for rent.",
      highlights: ["Equipment Rental", "Beginner Friendly", "2hr Minimum"],
    },
  ];

  return (
    <section className="py-28 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header with badge */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">What We Offer</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Two Sports, One Venue
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
                    Book Now
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

// ============================================
// PRICING — Lucky Hole card style (sharp corners, olive bg)
// ============================================
function PricingSection() {
  const t = useTranslations("home.pricing");

  return (
    <section className="py-28 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section header — centered */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-sm font-medium text-[#0a2540] uppercase tracking-[0.2em] mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Simple, Transparent Rates
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("noHiddenFees")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Badminton */}
          <div className="bg-card border border-border rounded-sm p-8 transition-all duration-300 hover:border-[#1854d6] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              {t("badminton.title")}
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">{t("badminton.offPeak")}</span>
                <span className="text-2xl font-semibold text-foreground">RM15<span className="text-sm font-normal text-muted-foreground">/hr</span></span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">{t("badminton.peak")}</span>
                <span className="text-2xl font-semibold text-foreground">RM18<span className="text-sm font-normal text-muted-foreground">/hr</span></span>
              </div>
            </div>
            <Link href="/booking" className="text-sm font-medium text-[#0a2540] hover:text-[#0a2540] uppercase tracking-wider inline-flex items-center">
              Book now <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Pickleball */}
          <div className="bg-card border border-border rounded-sm p-8 transition-all duration-300 hover:border-[#1854d6] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-forwards">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              {t("pickleball.title")}
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">{t("pickleball.rate")}</span>
                <span className="text-2xl font-semibold text-foreground">RM25<span className="text-sm font-normal text-muted-foreground">/hr</span></span>
              </div>
              <p className="text-sm text-muted-foreground">{t("pickleball.minimum")}</p>
            </div>
            <Link href="/booking?sport=pickleball" className="text-sm font-medium text-[#0a2540] hover:text-[#0a2540] uppercase tracking-wider inline-flex items-center">
              Book now <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Coaching */}
          <div className="bg-card border border-border rounded-sm p-8 transition-all duration-300 hover:border-[#1854d6] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-forwards">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              {t("coaching.title")}
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">{t("coaching.from")}</span>
                <span className="text-2xl font-semibold text-foreground">RM130</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("coaching.note")}</p>
            </div>
            <Link href="/lessons" className="text-sm font-medium text-[#0a2540] hover:text-[#0a2540] uppercase tracking-wider inline-flex items-center">
              View lessons <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
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
// REVIEWS — 4 review cards grid (Lucky Hole testimonials style)
// ============================================
function ReviewsSection() {
  const t = useTranslations("home.googleReviews");

  const reviews = [
    {
      text: "So hot but fun as hell! The courts are well-maintained and the booking system is super convenient. Love that it's open till midnight.",
      author: "Ying Jie Teoh",
      time: t("review1Time"),
      stars: 5,
    },
    {
      text: "Best badminton courts in Ayer Itam. Clean courts, good lighting with no glare, and the prices are very reasonable. Will come back!",
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
    <section className="py-28 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <p className="text-sm font-medium text-[#0a2540] uppercase tracking-[0.2em] mb-4">
            {t("subtitle")}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
            Guest Reviews
          </h2>
          <p className="text-muted-foreground">
            Rated <span className="text-[#0a2540] font-semibold">4.7</span> on Google &middot; 100+ reviews
          </p>
        </div>

        {/* Review cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-sm p-8 transition-all duration-300 hover:border-[#1854d6] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < review.stars ? "fill-[#1854d6] text-[#0a2540]" : "fill-gray-300 text-gray-300"}`}
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground text-sm italic leading-relaxed mb-6">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div>
                <span className="text-foreground text-sm font-medium">{review.author}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium bg-[#1854d6]/15 text-[#0a2540] px-2 py-0.5 rounded-sm uppercase tracking-wider">Google</span>
                  <span className="text-muted-foreground text-xs">{review.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-12 text-center animate-in fade-in duration-700 delay-300 fill-mode-forwards">
          <a
            href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#0a2540] hover:text-[#0a2540] uppercase tracking-wider inline-flex items-center"
          >
            {t("viewOnGoogle")} <ArrowRight className="ml-1 h-4 w-4" />
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
    <section className="py-28 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-card">
              <Image
                src="/images/strings-bg.jpg"
                alt="Racket stringing"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            <p className="text-sm font-medium text-[#0a2540] uppercase tracking-[0.2em] mb-4">
              Professional Service
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              {t("title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t("description")}
            </p>
            <Link href="/stringing">
              <Button
                variant="outline"
                className="h-11 px-6 text-sm font-medium uppercase tracking-wider rounded-sm border-[#1854d6] text-[#0a2540] hover:bg-[#2060e0] hover:text-white bg-transparent"
              >
                {t("cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// LOCATION — Two column with map
// ============================================
function LocationSection() {
  const t = useTranslations("home.location");

  return (
    <section className="py-28 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <p className="text-sm font-medium text-[#0a2540] uppercase tracking-[0.2em] mb-4">
              Find Us
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-10">
              {t("title")}
            </h2>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-[#0a2540]" />
                  <h3 className="font-medium text-foreground">{t("address.title")}</h3>
                </div>
                <p className="text-muted-foreground ml-8">
                  {t("address.line1")}<br />
                  {t("address.line2")}
                </p>
                <a
                  href="https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#0a2540] hover:text-[#0a2540] ml-8 mt-2 inline-flex items-center"
                >
                  {t("address.directions")} <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-[#0a2540]" />
                  <h3 className="font-medium text-foreground">{t("hours.title")}</h3>
                </div>
                <p className="text-muted-foreground ml-8">
                  {t("hours.weekdays")}<br />
                  {t("hours.weekends")}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-5 w-5 text-[#0a2540]" />
                  <h3 className="font-medium text-foreground">{t("contact.title")}</h3>
                </div>
                <p className="text-muted-foreground ml-8">
                  {t("contact.bookingsLabel")} <a href="tel:+60116868508" className="text-foreground hover:text-[#0a2540] transition-colors">011-6868 8508</a><br />
                  {t("contact.lessonsLabel")} <a href="tel:+60117575508" className="text-foreground hover:text-[#0a2540] transition-colors">011-7575 8508</a>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-sm overflow-hidden h-80 md:h-auto animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
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
    <div className="min-h-screen bg-background">
      <HeroSection />
      <AboutSection />
      <SportsSection />
      <PricingSection />
      <ReviewsSection />
      <StringingSection />
      <LocationSection />
    </div>
  );
}
