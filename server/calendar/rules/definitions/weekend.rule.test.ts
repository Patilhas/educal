import { describe, it, expect } from "vitest";
import { weekendRule } from "./weekend.rule";
import { makeEvent, makeOccurrence, makeContext } from "./__fixtures__/builders";

const baseConfig = { checkStart: false, checkEnd: false, checkRange: false };

describe("weekendRule", () => {
  it("flags a start date that falls on a weekend", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-10T00:00:00.000Z", // Saturday
      endDate: "2026-01-10T00:00:00.000Z",
    });
    const violations = weekendRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext(),
    );
    expect(violations).toEqual([
      { fieldLabelKey: "start", date: "2026-01-10T00:00:00.000Z", messageKey: "startIsWeekend" },
    ]);
  });

  it("does not flag a start date that falls on a weekday", () => {
    const occurrence = makeOccurrence({ startDate: "2026-01-05T00:00:00.000Z" }); // Monday
    const violations = weekendRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext(),
    );
    expect(violations).toEqual([]);
  });

  it("flags an end date that falls on a weekend", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-05T00:00:00.000Z",
      endDate: "2026-01-10T00:00:00.000Z", // Saturday
    });
    const violations = weekendRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkEnd: true },
      makeContext(),
    );
    expect(violations).toEqual([
      { fieldLabelKey: "end", date: "2026-01-10T00:00:00.000Z", messageKey: "endIsWeekend" },
    ]);
  });

  it("flags the first weekend day found within the range and stops there", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-09T00:00:00.000Z", // Friday
      endDate: "2026-01-12T00:00:00.000Z", // Monday
    });
    const violations = weekendRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkRange: true },
      makeContext(),
    );
    expect(violations).toEqual([
      { fieldLabelKey: "range", date: "2026-01-10T00:00:00.000Z", messageKey: "rangeHasWeekend" },
    ]);
  });

  it("returns no violations when all flags are false", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-10T00:00:00.000Z",
      endDate: "2026-01-11T00:00:00.000Z",
    });
    const violations = weekendRule.validate(makeEvent(), occurrence, baseConfig, makeContext());
    expect(violations).toEqual([]);
  });
});
