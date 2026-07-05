import { describe, it, expect } from "vitest";
import { minDurationRule } from "./min-duration.rule";
import { makeEvent, makeOccurrence, makeContext } from "./__fixtures__/builders";

describe("minDurationRule", () => {
  it("does not flag an occurrence exactly at the minimum duration", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-05T00:00:00.000Z",
      endDate: "2026-01-08T00:00:00.000Z",
      minDays: 3,
    });
    const violations = minDurationRule.validate(makeEvent(), occurrence, {}, makeContext());
    expect(violations).toEqual([]);
  });

  it("flags an occurrence shorter than the minimum duration", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-05T00:00:00.000Z",
      endDate: "2026-01-08T00:00:00.000Z",
      minDays: 4,
    });
    const violations = minDurationRule.validate(makeEvent(), occurrence, {}, makeContext());
    expect(violations).toEqual([
      { date: "2026-01-05T00:00:00.000Z", messageKey: "durationTooShort", messageParams: { required: "4", actual: "3" } },
    ]);
  });

  it("skips validation when minDays is not set", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-05T00:00:00.000Z",
      endDate: "2026-01-08T00:00:00.000Z",
    });
    const violations = minDurationRule.validate(makeEvent(), occurrence, {}, makeContext());
    expect(violations).toEqual([]);
  });
});
