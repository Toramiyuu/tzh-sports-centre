/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLessonTypes } from "@/lib/hooks/useLessonTypes";

const mockLessonTypes = [
  {
    id: "lt1",
    name: "1-to-1 Private",
    slug: "1-to-1",
    description: "Private coaching",
    detailedDescription: "Full private coaching description",
    billingType: "per_session",
    price: 130,
    maxStudents: 1,
    sessionsPerMonth: null,
    isActive: true,
    pricingTiers: [
      { id: "pt1", duration: 1.5, price: 130 },
      { id: "pt2", duration: 2, price: 160 },
    ],
  },
  {
    id: "lt2",
    name: "1-to-2",
    slug: "1-to-2",
    description: "Semi-private",
    detailedDescription: null,
    billingType: "per_session",
    price: 160,
    maxStudents: 2,
    sessionsPerMonth: null,
    isActive: true,
    pricingTiers: [
      { id: "pt3", duration: 1.5, price: 160 },
      { id: "pt4", duration: 2, price: 180 },
    ],
  },
  {
    id: "lt3",
    name: "Kids Group",
    slug: "kids-group",
    description: "Monthly kids class",
    detailedDescription: null,
    billingType: "monthly",
    price: 50,
    maxStudents: 6,
    sessionsPerMonth: 4,
    isActive: true,
    pricingTiers: [],
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useLessonTypes", () => {
  it("should fetch lesson types on mount", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lessonTypes).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it("should set error on fetch failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.lessonTypes).toHaveLength(0);
  });

  it("getLessonTypeBySlug returns correct type", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const lt = result.current.getLessonTypeBySlug("1-to-1");
    expect(lt?.name).toBe("1-to-1 Private");
    expect(result.current.getLessonTypeBySlug("nonexistent")).toBeUndefined();
  });

  it("getLessonPrice returns tier price for per_session with duration", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLessonPrice("1-to-1", 1.5)).toBe(130);
    expect(result.current.getLessonPrice("1-to-1", 2)).toBe(160);
  });

  it("getLessonPrice returns minimum tier price when no duration specified", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLessonPrice("1-to-1")).toBe(130);
  });

  it("getLessonPrice returns flat price for monthly billing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getLessonPrice("kids-group")).toBe(50);
  });

  it("getDurationOptions returns tier-based options", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const opts = result.current.getDurationOptions("1-to-1");
    expect(opts).toHaveLength(2);
    expect(opts[0]).toEqual({
      value: 1.5,
      label: "1.5 hours",
      price: 130,
      pricePerPerson: undefined,
    });
  });

  it("getDurationOptions includes pricePerPerson for group lessons", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const opts = result.current.getDurationOptions("1-to-2");
    expect(opts[0].pricePerPerson).toBe(80);
  });

  it("getDurationOptions returns empty for monthly types", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getDurationOptions("kids-group")).toEqual([]);
  });

  it("isMonthlyBilling returns correct value", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isMonthlyBilling("kids-group")).toBe(true);
    expect(result.current.isMonthlyBilling("1-to-1")).toBe(false);
  });

  it("getPricePerPerson returns null for single-student types", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getPricePerPerson("1-to-1", 1.5)).toBeNull();
  });

  it("getPricePerPerson returns computed value for group types", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getPricePerPerson("1-to-2", 1.5)).toBe(80);
    expect(result.current.getPricePerPerson("1-to-2", 2)).toBe(90);
  });

  it("getDefaultDuration returns first tier duration", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ lessonTypes: mockLessonTypes }),
    });

    const { result } = renderHook(() => useLessonTypes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getDefaultDuration("1-to-1")).toBe(1.5);
    expect(result.current.getDefaultDuration("kids-group")).toBe(2);
  });
});
