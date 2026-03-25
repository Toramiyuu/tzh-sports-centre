"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
} from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("home");
  const sectionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Mouse tracking for 3D phone tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 100, damping: 20 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [10, -10]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-10, 10]),
    springConfig
  );

  // Scroll parallax — different layers move at different speeds
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const badge1Y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const badge2Y = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Staggered entrance
  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/[0.03] to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.04] blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left: Text + CTAs */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: textY }}
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Status badge */}
            <motion.div variants={fadeUp} className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  {t("hero.openNow")}
                </span>
              </div>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-sm font-medium text-primary uppercase tracking-[0.2em] mb-4"
            >
              {t("hero.location")}
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display text-foreground tracking-tight leading-[0.95] mb-6"
            >
              {t("hero.headline")}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0"
            >
              {t("hero.subheadline")}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6"
            >
              <Link href="/booking">
                <Button className="h-12 px-8 text-sm font-medium uppercase tracking-wider bg-primary hover:bg-primary/90 text-white rounded-full">
                  {t("hero.bookCourt")}
                </Button>
              </Link>
              <Link href="/lessons">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-sm font-medium uppercase tracking-wider border-border text-foreground hover:bg-secondary rounded-full"
                >
                  {t("hero.viewLessons")}
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center lg:justify-start gap-3"
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {t("hero.socialProof")}
              </span>
            </motion.div>
          </motion.div>

          {/* Right: Phone mockup with 3D tilt */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: phoneY }}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative" style={{ perspective: "1200px" }}>
              {/* Phone with tilt */}
              <motion.div
                style={
                  shouldReduceMotion
                    ? {}
                    : {
                        rotateX,
                        rotateY,
                        transformStyle: "preserve-3d" as const,
                      }
                }
              >
                <div
                  className="relative w-[260px] h-[540px] sm:w-[280px] sm:h-[580px] rounded-[3rem] bg-neutral-900 p-2 shadow-2xl shadow-black/25 dark:shadow-black/50"
                  style={{
                    boxShadow:
                      "inset 0 0 0 2px rgba(255,255,255,0.1), 0 30px 60px -15px rgba(0,0,0,0.3), 0 15px 25px -5px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Screen */}
                  <div className="w-full h-full rounded-[2.4rem] bg-[#070e1b] overflow-hidden relative">
                    {/* Dynamic Island */}
                    <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-black rounded-full z-20 flex items-center justify-end pr-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
                        style={{
                          boxShadow: "0 0 6px rgba(34,197,94,0.7)",
                        }}
                      />
                    </div>

                    {/* Screen glare */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none z-10 rounded-[2.4rem]" />

                    {/* App UI */}
                    <div className="relative z-0 pt-11 px-5 pb-6 h-full flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-5">
                        <div>
                          <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-bold">
                            Today
                          </p>
                          <p className="text-lg font-bold text-white tracking-tight">
                            Booking
                          </p>
                        </div>
                        <div
                          className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-400/20 flex items-center justify-center"
                          style={{
                            boxShadow:
                              "0 4px 12px rgba(0,0,0,0.4)",
                          }}
                        >
                          <span className="text-[10px] font-bold text-blue-400">
                            TZ
                          </span>
                        </div>
                      </div>

                      {/* Live courts indicator */}
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-green-400">
                          3 courts available now
                        </span>
                      </div>

                      {/* Booking cards */}
                      <div className="space-y-3 flex-1">
                        <div
                          className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3.5"
                          style={{
                            boxShadow:
                              "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/15 flex items-center justify-center">
                              <span className="text-sm">
                                🏸
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold text-white/85">
                                Badminton Court 3
                              </p>
                              <p className="text-[10px] text-white/35">
                                Today · 7:00 – 9:00 PM
                              </p>
                            </div>
                            <div className="px-2 py-1 rounded-full bg-green-500/15">
                              <span className="text-[9px] font-bold text-green-400">
                                Confirmed
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3.5"
                          style={{
                            boxShadow:
                              "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/15 flex items-center justify-center">
                              <span className="text-sm">
                                🏓
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold text-white/85">
                                Pickleball Court 1
                              </p>
                              <p className="text-[10px] text-white/35">
                                Tomorrow · 10:00 AM
                              </p>
                            </div>
                            <div className="px-2 py-1 rounded-full bg-amber-500/15">
                              <span className="text-[9px] font-bold text-amber-400">
                                Pending
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3.5"
                          style={{
                            boxShadow:
                              "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/15 flex items-center justify-center">
                              <span className="text-sm">
                                💳
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold text-white/85">
                                Credit Balance
                              </p>
                              <p className="text-[10px] text-white/35">
                                RM 45.00 remaining
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Book CTA */}
                      <div className="mt-4 rounded-2xl bg-blue-500/90 py-3 text-center">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Book a Court
                        </span>
                      </div>

                      {/* Home indicator */}
                      <div className="mt-3 mx-auto w-[100px] h-[4px] bg-white/15 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge: Court Booked */}
              <motion.div
                style={shouldReduceMotion ? {} : { y: badge1Y }}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -left-4 sm:-left-20 top-12 sm:top-16 bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xl shadow-black/10 dark:shadow-black/30"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-sm">🏸</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Court Booked
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Badminton · Court 3
                  </p>
                </div>
              </motion.div>

              {/* Floating badge: Rating */}
              <motion.div
                style={shouldReduceMotion ? {} : { y: badge2Y }}
                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="absolute -right-4 sm:-right-16 bottom-20 sm:bottom-24 bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xl shadow-black/10 dark:shadow-black/30"
              >
                <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                  <div className="flex">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    4.7 Rating
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Google Reviews
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
