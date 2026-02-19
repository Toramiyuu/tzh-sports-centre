import { describe, it, expect } from "vitest";
import { validateTeacherName, validatePayRate } from "@/lib/validation";

describe("validateTeacherName", () => {
  it("returns trimmed name for valid input", () => {
    expect(validateTeacherName("  Coach Lee  ")).toBe("Coach Lee");
  });

  it("returns null for empty string", () => {
    expect(validateTeacherName("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(validateTeacherName("   ")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(validateTeacherName(null)).toBeNull();
    expect(validateTeacherName(undefined)).toBeNull();
  });

  it("returns null for names over 100 characters", () => {
    expect(validateTeacherName("A".repeat(101))).toBeNull();
  });

  it("accepts names exactly 100 characters", () => {
    const name = "A".repeat(100);
    expect(validateTeacherName(name)).toBe(name);
  });

  it("accepts single character names", () => {
    expect(validateTeacherName("A")).toBe("A");
  });
});

describe("validatePayRate", () => {
  it("returns number for valid positive rate", () => {
    expect(validatePayRate(50)).toBe(50);
  });

  it("returns number for valid decimal rate", () => {
    expect(validatePayRate(50.5)).toBe(50.5);
  });

  it("returns null for zero", () => {
    expect(validatePayRate(0)).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(validatePayRate(-10)).toBeNull();
  });

  it("returns null for rates over 10000", () => {
    expect(validatePayRate(10001)).toBeNull();
  });

  it("accepts rate of exactly 10000", () => {
    expect(validatePayRate(10000)).toBe(10000);
  });

  it("returns null for null/undefined", () => {
    expect(validatePayRate(null)).toBeNull();
    expect(validatePayRate(undefined)).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(validatePayRate("abc")).toBeNull();
  });

  it("converts numeric strings to numbers", () => {
    expect(validatePayRate("50")).toBe(50);
  });
});
