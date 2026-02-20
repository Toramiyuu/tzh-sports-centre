"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface LessonTypePricingTier {
  id: string;
  duration: number;
  price: number;
}

export interface LessonTypeData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  detailedDescription: string | null;
  billingType: string;
  price: number;
  maxStudents: number;
  sessionsPerMonth: number | null;
  isActive: boolean;
  pricingTiers: LessonTypePricingTier[];
}

export function useLessonTypes() {
  const [lessonTypes, setLessonTypes] = useState<LessonTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLessonTypes() {
      try {
        const res = await fetch("/api/lesson-types");
        if (!res.ok) throw new Error("Failed to fetch lesson types");
        const data = await res.json();
        if (!cancelled) {
          setLessonTypes(data.lessonTypes);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }
    fetchLessonTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const getLessonTypeBySlug = useCallback(
    (slug: string) => lessonTypes.find((lt) => lt.slug === slug),
    [lessonTypes],
  );

  const getLessonPrice = useCallback(
    (slug: string, duration?: number): number => {
      const lt = lessonTypes.find((t) => t.slug === slug);
      if (!lt) return 0;

      if (lt.billingType === "monthly") return lt.price;

      if (duration && lt.pricingTiers.length > 0) {
        const tier = lt.pricingTiers.find((t) => t.duration === duration);
        if (tier) return tier.price;
      }

      if (lt.pricingTiers.length > 0) {
        return Math.min(...lt.pricingTiers.map((t) => t.price));
      }

      return lt.price;
    },
    [lessonTypes],
  );

  const getDurationOptions = useCallback(
    (
      slug: string,
    ): {
      value: number;
      label: string;
      price: number;
      pricePerPerson?: number;
    }[] => {
      const lt = lessonTypes.find((t) => t.slug === slug);
      if (!lt || lt.billingType === "monthly" || lt.pricingTiers.length === 0)
        return [];

      return lt.pricingTiers.map((tier) => ({
        value: tier.duration,
        label: `${tier.duration} hours`,
        price: tier.price,
        pricePerPerson:
          lt.maxStudents > 1
            ? Math.round(tier.price / lt.maxStudents)
            : undefined,
      }));
    },
    [lessonTypes],
  );

  const isMonthlyBilling = useCallback(
    (slug: string): boolean => {
      const lt = lessonTypes.find((t) => t.slug === slug);
      return lt?.billingType === "monthly";
    },
    [lessonTypes],
  );

  const getPricePerPerson = useCallback(
    (slug: string, duration?: number): number | null => {
      const lt = lessonTypes.find((t) => t.slug === slug);
      if (!lt || lt.maxStudents <= 1) return null;

      const totalPrice =
        duration && lt.pricingTiers.length > 0
          ? (lt.pricingTiers.find((t) => t.duration === duration)?.price ??
            lt.price)
          : lt.price;

      return Math.round(totalPrice / lt.maxStudents);
    },
    [lessonTypes],
  );

  const getDefaultDuration = useCallback(
    (slug: string): number => {
      const lt = lessonTypes.find((t) => t.slug === slug);
      if (!lt || lt.pricingTiers.length === 0) return 2;
      return lt.pricingTiers[0].duration;
    },
    [lessonTypes],
  );

  const helpers = useMemo(
    () => ({
      getLessonTypeBySlug,
      getLessonPrice,
      getDurationOptions,
      isMonthlyBilling,
      getPricePerPerson,
      getDefaultDuration,
    }),
    [
      getLessonTypeBySlug,
      getLessonPrice,
      getDurationOptions,
      isMonthlyBilling,
      getPricePerPerson,
      getDefaultDuration,
    ],
  );

  return { lessonTypes, loading, error, ...helpers };
}
