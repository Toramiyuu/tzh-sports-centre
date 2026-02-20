import { describe, it, expect } from "vitest";
import {
  calculateProRatedPrice,
  calculateRemainingSessions,
  getMonthlyTrainingDates,
  isValidTrainingDate,
} from "@/lib/date-utils";

describe("calculateProRatedPrice", () => {
  it("calculates pro-rated price for monthly lessons", () => {
    expect(calculateProRatedPrice(50, 4, 4)).toBe(50);
    expect(calculateProRatedPrice(50, 4, 2)).toBe(25);
    expect(calculateProRatedPrice(50, 4, 3)).toBe(38);
  });

  it("rounds to nearest integer", () => {
    expect(calculateProRatedPrice(140, 4, 3)).toBe(105);
  });

  it("returns 0 when no remaining sessions", () => {
    expect(calculateProRatedPrice(100, 4, 0)).toBe(0);
  });
});

describe("calculateRemainingSessions", () => {
  it("counts remaining sessions in a month", () => {
    const feb3 = new Date(2026, 1, 3);
    expect(calculateRemainingSessions(1, feb3)).toBe(3);

    const feb10 = new Date(2026, 1, 10);
    expect(calculateRemainingSessions(1, feb10)).toBe(2);
  });

  it("skips 5th occurrence of a weekday", () => {
    const mar1 = new Date(2026, 2, 1);
    expect(calculateRemainingSessions(0, mar1)).toBe(4);
  });

  it("returns 0 when past all valid occurrences", () => {
    const feb28 = new Date(2026, 1, 28);
    expect(calculateRemainingSessions(1, feb28)).toBe(0);
  });
});

describe("getMonthlyTrainingDates", () => {
  it("returns first 4 occurrences of a weekday in a month", () => {
    const dates = getMonthlyTrainingDates(1, 2026, 1);
    expect(dates).toHaveLength(4);
    expect(dates[0].getDate()).toBe(2);
    expect(dates[1].getDate()).toBe(9);
    expect(dates[2].getDate()).toBe(16);
    expect(dates[3].getDate()).toBe(23);
  });

  it("returns only 4 dates even if 5 occurrences exist", () => {
    const dates = getMonthlyTrainingDates(0, 2026, 2);
    expect(dates).toHaveLength(4);
    expect(dates[3].getDate()).toBe(22);
  });
});

describe("isValidTrainingDate", () => {
  it("returns true for dates within first 4 occurrences", () => {
    expect(isValidTrainingDate(new Date(2026, 2, 1))).toBe(true);
    expect(isValidTrainingDate(new Date(2026, 2, 8))).toBe(true);
    expect(isValidTrainingDate(new Date(2026, 2, 15))).toBe(true);
    expect(isValidTrainingDate(new Date(2026, 2, 22))).toBe(true);
  });

  it("returns false for 5th occurrence", () => {
    expect(isValidTrainingDate(new Date(2026, 2, 29))).toBe(false);
  });

  it("handles multiple 5th occurrences correctly", () => {
    expect(isValidTrainingDate(new Date(2026, 0, 29))).toBe(false);
  });
});
