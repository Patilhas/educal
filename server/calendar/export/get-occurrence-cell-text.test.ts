import { describe, it, expect } from "vitest";
import { getOccurrenceCellText } from "./get-occurrence-cell-text";

describe("getOccurrenceCellText", () => {
  it("returns just the day for a single-day occurrence", () => {
    const text = getOccurrenceCellText(
      "2025-09-15T00:00:00.000Z",
      "2025-09-15T00:00:00.000Z",
    );
    expect(text).toBe("15");
  });

  it("returns a day range for a multi-day occurrence within the same month", () => {
    const text = getOccurrenceCellText(
      "2026-07-05T00:00:00.000Z",
      "2026-07-15T00:00:00.000Z",
    );
    expect(text).toBe("5-15");
  });

  it("returns a day-to-day-with-month range when spanning into the next month", () => {
    const text = getOccurrenceCellText(
      "2026-02-28T00:00:00.000Z",
      "2026-03-03T00:00:00.000Z",
    );
    expect(text).toBe("28 - 3 Mar");
  });

  it("returns a day-to-day-with-month range when spanning three months", () => {
    const text = getOccurrenceCellText(
      "2026-01-28T00:00:00.000Z",
      "2026-04-03T00:00:00.000Z",
    );
    expect(text).toBe("28 - 3 Abr");
  });
});
