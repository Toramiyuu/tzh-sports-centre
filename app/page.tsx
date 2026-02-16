"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowRight, Star, Trophy, Wrench, GraduationCap, Zap, Check, Quote, ShoppingBag, Sparkles, Calendar } from "lucide-react";
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
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-8 animate-in fade-in duration-700 fill-mode-forwards">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/80">Open now until 12:00 AM</span>
        </div>

        <p className="text-sm font-medium text-white/70 uppercase tracking-[0.2em] mb-6 animate-in fade-in duration-700 delay-100 fill-mode-forwards">
          Ayer Itam, Penang
        </p>

        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-6 animate-in fade-in duration-700 delay-200 fill-mode-forwards">
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
            <Button className="h-12 px-6 sm:px-8 text-sm font-medium uppercase tracking-wider bg-primary hover:bg-primary/90 text-white rounded-sm">
              {t("hero.bookCourt")}
            </Button>
          </Link>
          <Link href="/lessons">
            <Button
              variant="outline"
              className="h-12 px-6 sm:px-8 text-sm font-medium uppercase tracking-wider border-white/40 text-white bg-transparent hover:bg-white/10 dark:bg-transparent dark:hover:bg-white/10 rounded-sm"
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
    <section className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
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
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
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
    <section className="py-16 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header with badge */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">What We Offer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
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
// PRICING — Comparison table
// ============================================
function PricingSection() {
  const t = useTranslations("home.pricing");

  const plans = [
    {
      name: t("badminton.title"),
      price: "RM15",
      unit: "/hr",
      note: "Peak: RM18/hr",
      popular: false,
      features: ["Online booking", "Walk-ins welcome", "Quality vinyl flooring", "Zero-glare lighting", "Clean between sessions"],
      href: "/booking",
      cta: "Book Court",
    },
    {
      name: t("pickleball.title"),
      price: "RM25",
      unit: "/hr",
      note: "2hr minimum",
      popular: true,
      features: ["Online booking", "Equipment rental", "Beginner friendly", "Quality vinyl flooring", "Zero-glare lighting"],
      href: "/booking?sport=pickleball",
      cta: "Book Court",
    },
    {
      name: t("coaching.title"),
      price: "RM50",
      unit: "/mo",
      note: "Group classes from RM50. Private from RM130.",
      popular: false,
      features: ["BAM-certified coaches", "All skill levels", "Kids & adult groups", "Private sessions available", "Flexible scheduling"],
      href: "/lessons",
      cta: "View Lessons",
    },
  ];

  return (
    <section className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Rates
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("noHiddenFees")}
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards ${
                plan.popular
                  ? "bg-primary text-white border-2 border-primary shadow-lg shadow-primary/20"
                  : "bg-card border border-border hover:border-primary/30"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-xs font-bold uppercase tracking-wider">Popular</span>
                </div>
              )}

              <div className="p-8">
                <h3 className={`text-lg font-semibold mb-6 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-2">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>{plan.unit}</span>
                </div>
                <p className={`text-sm mb-8 ${plan.popular ? "text-white/60" : "text-muted-foreground"}`}>{plan.note}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? "bg-white/20" : "bg-primary/10"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? "text-white" : "text-primary"}`} />
                      </div>
                      <span className={`text-sm ${plan.popular ? "text-white/90" : "text-muted-foreground"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.href}>
                  <Button className={`w-full h-11 font-medium rounded-lg group/btn ${
                    plan.popular
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Hours footer */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground animate-in fade-in duration-700 delay-300 fill-mode-forwards">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Clock className="h-4 w-4 text-primary" />
            <span>{t("hours.weekdays")}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Clock className="h-4 w-4 text-primary" />
            <span>{t("hours.weekends")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// REVIEWS — Masonry grid with Google summary card
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
            What Players Say
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
                <div className="text-white/70 text-sm">Google Rating</div>
              </div>
            </div>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className={`h-5 w-5 ${j < 5 ? "fill-white text-white" : "fill-white/30 text-white/30"}`} />
              ))}
            </div>
            <p className="text-white/80 text-sm mb-5">Based on 100+ verified reviews from real players.</p>
            <a
              href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors"
            >
              View on Google <ArrowRight className="h-4 w-4" />
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
                    className={`h-4 w-4 ${j < review.stars ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
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

// ============================================
// STRINGING — Full-width banner with image background
// ============================================
function StringingSection() {
  const t = useTranslations("home.stringingPromo");

  const features = ["18+ String Options", "Same-Day Service", "Expert Tension", "All Brands"];

  return (
    <section className="relative py-16 md:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/strings-bg.jpg"
          alt="Racket stringing"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6 animate-in fade-in duration-700 fill-mode-forwards">
            <Wrench className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Professional Service</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 animate-in fade-in duration-700 delay-100 fill-mode-forwards">
            {t("title")}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed mb-8 animate-in fade-in duration-700 delay-200 fill-mode-forwards">
            {t("description")}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mb-10 animate-in fade-in duration-700 delay-300 fill-mode-forwards">
            {features.map((f) => (
              <span key={f} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white">
                <Check className="w-3.5 h-3.5 text-green-400" />
                {f}
              </span>
            ))}
          </div>

          <Link href="/stringing" className="animate-in fade-in duration-700 delay-400 fill-mode-forwards inline-block">
            <Button className="h-12 px-6 sm:px-8 bg-white text-black hover:bg-white/90 font-medium rounded-lg group/btn">
              {t("cta")}
              <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SHOP — Pro Shop promo section
// ============================================
function ShopSection() {
  const categories = [
    { name: "Rackets", image: "/images/shop/rackets/tzh-r-ninja-stealth-x.jpg", count: "20+" },
    { name: "Shoes", image: "/images/shop/shoes/tzh-s-court-ace-pro.jpg", count: "15+" },
    { name: "Bags", image: "/images/shop/bags/tzh-b-elite-tour-6r.jpg", count: "10+" },
    { name: "Accessories", image: "/images/shop/grips/tzh-g-pro-overgrip-3pk.jpg", count: "30+" },
  ];

  return (
    <section className="py-16 md:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Text + CTA */}
          <div className="animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-forwards">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pro Shop</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
              Gear Up for <br className="hidden md:block" />Your Game
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Browse our collection of rackets, shoes, bags, and accessories from TZH and top brands. Available in-store and online.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {["Yonex", "Li-Ning", "Joola", "Victor"].map((brand) => (
                <span key={brand} className="px-3 py-1 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground">
                  {brand}
                </span>
              ))}
            </div>

            <Link href="/shop">
              <Button className="h-12 px-6 sm:px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg group/btn">
                Browse Shop
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Right: Category grid */}
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-forwards">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                href={`/shop?category=${cat.name.toLowerCase()}`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-white font-bold text-sm">{cat.name}</div>
                  <div className="text-white/60 text-xs">{cat.count} products</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// LOCATION — Cards + styled map
// ============================================
function LocationSection() {
  const t = useTranslations("home.location");

  const contactInfo = [
    {
      icon: MapPin,
      title: t("address.title"),
      content: (
        <>
          {t("address.line1")}<br />{t("address.line2")}
        </>
      ),
      action: {
        label: t("address.directions"),
        href: "https://maps.app.goo.gl/xmtbgwLbfGoEUDWA9",
        external: true,
      },
    },
    {
      icon: Clock,
      title: t("hours.title"),
      content: (
        <>
          {t("hours.weekdays")}<br />{t("hours.weekends")}
        </>
      ),
    },
    {
      icon: Phone,
      title: t("contact.title"),
      content: (
        <>
          {t("contact.bookingsLabel")} <a href="tel:+60116868508" className="text-foreground hover:text-primary transition-colors">011-6868 8508</a><br />
          {t("contact.lessonsLabel")} <a href="tel:+60117575508" className="text-foreground hover:text-primary transition-colors">011-7575 8508</a>
        </>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-32 bg-secondary">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-in fade-in duration-700 fill-mode-forwards">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Find Us</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
            {t("title")}
          </h2>
        </div>

        {/* Info cards row */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
          {contactInfo.map((info) => (
            <div
              key={info.title}
              className="rounded-2xl bg-card border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <info.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{info.content}</p>
              {info.action && (
                <a
                  href={info.action.href}
                  target={info.action.external ? "_blank" : undefined}
                  rel={info.action.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 mt-3 transition-colors"
                >
                  {info.action.label} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1986.0259229585!2d100.29758!3d5.4090748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac300162c75fd%3A0x65461617c304bf30!2sTZH%20Badminton%20Academy!5e0!3m2!1sen!2smy!4v1705000000000"
            width="100%"
            height="300"
            className="md:h-[400px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
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
      <ShopSection />
      <LocationSection />
    </div>
  );
}
