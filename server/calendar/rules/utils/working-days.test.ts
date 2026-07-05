import { describe, it, expect } from "vitest";
import { countWorkingDaysBetween, countWorkingDaysInclusive } from "./working-days";

describe("countWorkingDaysBetween", () => {
  it("counts working days strictly between two weekdays with no weekend/holiday", () => {
    const from = new Date("2026-01-05T00:00:00.000Z"); // Monday
    const to = new Date("2026-01-09T00:00:00.000Z"); // Friday
    expect(countWorkingDaysBetween(from, to)).toBe(3); // Tue, Wed, Thu
  });

  it("excludes weekend-only days from the count", () => {
    const from = new Date("2026-01-09T00:00:00.000Z"); // Friday
    const to = new Date("2026-01-12T00:00:00.000Z"); // Monday
    expect(countWorkingDaysBetween(from, to)).toBe(0); // Sat, Sun only
  });

  it("excludes a holiday-and-weekend span from the count", () => {
    const from = new Date("2026-12-23T00:00:00.000Z"); // Wednesday
    const to = new Date("2026-12-28T00:00:00.000Z"); // Monday
    // Thu 24th is "Noite de Natal" (observance), Fri 25th is "Natal" (public
    // holiday), Sat/Sun are weekend — every day strictly between is excluded.
    expect(countWorkingDaysBetween(from, to)).toBe(0);
  });

  it("returns 0 when from equals to", () => {
    const date = new Date("2026-01-05T00:00:00.000Z");
    expect(countWorkingDaysBetween(date, date)).toBe(0);
  });

  it("returns 0 when from is after to", () => {
    const from = new Date("2026-01-12T00:00:00.000Z");
    const to = new Date("2026-01-05T00:00:00.000Z");
    expect(countWorkingDaysBetween(from, to)).toBe(0);
  });
});

describe("countWorkingDaysInclusive", () => {
  it("counts working days inclusive of both endpoints with no weekend/holiday", () => {
    const start = new Date("2026-01-05T00:00:00.000Z"); // Monday
    const end = new Date("2026-01-09T00:00:00.000Z"); // Friday
    expect(countWorkingDaysInclusive(start, end)).toBe(5);
  });

  it("excludes weekend days but counts the weekday endpoints", () => {
    const start = new Date("2026-01-09T00:00:00.000Z"); // Friday
    const end = new Date("2026-01-12T00:00:00.000Z"); // Monday
    expect(countWorkingDaysInclusive(start, end)).toBe(2);
  });

  it("excludes a holiday-and-weekend span but counts the weekday endpoints", () => {
    const start = new Date("2026-12-23T00:00:00.000Z"); // Wednesday
    const end = new Date("2026-12-28T00:00:00.000Z"); // Monday
    expect(countWorkingDaysInclusive(start, end)).toBe(2); // only Dec 23 and Dec 28 count
  });

  it("returns 0 when start is after end", () => {
    const start = new Date("2026-01-12T00:00:00.000Z");
    const end = new Date("2026-01-05T00:00:00.000Z");
    expect(countWorkingDaysInclusive(start, end)).toBe(0);
  });
});
