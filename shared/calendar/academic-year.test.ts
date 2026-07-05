import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getAcademicYearLabel,
  getAcademicYearRange,
  getAcademicYearOptions,
  getEventAcademicYearStart,
  shiftDateByYears,
} from "./academic-year";

describe("getAcademicYearLabel", () => {
  it("formats a start year as a start/end year span", () => {
    expect(getAcademicYearLabel(2026)).toBe("2026/2027");
  });
});

describe("getAcademicYearRange", () => {
  it("returns Jan 1 of the start year through Sep 30 of the following year", () => {
    expect(getAcademicYearRange(2026)).toEqual({
      startYear: 2026,
      label: "2026/2027",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2027-09-30T23:59:59.999Z",
    });
  });
});

describe("getAcademicYearOptions", () => {
  it("returns a span of years centered on the anchor year using the default span", () => {
    expect(getAcademicYearOptions(2026)).toEqual([2024, 2025, 2026, 2027, 2028]);
  });

  it("returns a narrower span when a custom span is given", () => {
    expect(getAcademicYearOptions(2026, 1)).toEqual([2025, 2026, 2027]);
  });
});

describe("getEventAcademicYearStart", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the year of the first occurrence's start date", () => {
    expect(
      getEventAcademicYearStart({
        occurrences: [
          {
            id: "o1",
            description: "",
            startDate: "2027-03-01T00:00:00.000Z",
            endDate: "2027-03-01T00:00:00.000Z",
          },
        ],
      }),
    ).toBe(2027);
  });

  it("falls back to the current year when there are no occurrences", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T00:00:00.000Z"));
    expect(getEventAcademicYearStart({ occurrences: [] })).toBe(2026);
  });
});

describe("shiftDateByYears", () => {
  it("shifts a normal date forward by the given number of years", () => {
    expect(shiftDateByYears("2026-01-05T00:00:00.000Z", 1)).toBe("2027-01-05T00:00:00.000Z");
  });

  it("clamps Feb 29 to Feb 28 when the target year is not a leap year", () => {
    expect(shiftDateByYears("2028-02-29T00:00:00.000Z", 1)).toBe("2029-02-28T00:00:00.000Z");
  });
});
