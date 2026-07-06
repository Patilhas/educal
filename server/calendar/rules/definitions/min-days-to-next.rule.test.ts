import { describe, it, expect } from "vitest";
import { minDaysToNextRule } from "./min-days-to-next.rule";
import { makeEvent, makeOccurrence, makeContext } from "./__fixtures__/builders";

describe("minDaysToNextRule", () => {
  it("flags an insufficient working-day gap to the next occurrence", () => {
    const event = makeEvent({
      occurrences: [
        makeOccurrence({
          id: "o1",
          startDate: "2026-01-05T00:00:00.000Z",
          endDate: "2026-01-05T00:00:00.000Z",
          minDaysToNext: 5,
        }),
        makeOccurrence({ id: "o2", startDate: "2026-01-12T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = minDaysToNextRule.validate(event, event.occurrences[0], {}, makeContext());
    expect(violations).toEqual([
      { date: "2026-01-05T00:00:00.000Z", messageKey: "gapTooShort", messageParams: { required: "5", actual: "4" } },
    ]);
  });

  it("does not flag a sufficient working-day gap", () => {
    const event = makeEvent({
      occurrences: [
        makeOccurrence({
          id: "o1",
          startDate: "2026-01-05T00:00:00.000Z",
          endDate: "2026-01-05T00:00:00.000Z",
          minDaysToNext: 3,
        }),
        makeOccurrence({ id: "o2", startDate: "2026-01-12T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = minDaysToNextRule.validate(event, event.occurrences[0], {}, makeContext());
    expect(violations).toEqual([]);
  });

  it("skips validation when minDaysToNext is not set", () => {
    const event = makeEvent({
      occurrences: [
        makeOccurrence({ id: "o1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-05T00:00:00.000Z" }),
        makeOccurrence({ id: "o2", startDate: "2026-01-12T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = minDaysToNextRule.validate(event, event.occurrences[0], {}, makeContext());
    expect(violations).toEqual([]);
  });

  it("returns no violations for the last occurrence, which has no next occurrence", () => {
    const event = makeEvent({
      occurrences: [
        makeOccurrence({ id: "o1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-05T00:00:00.000Z" }),
        makeOccurrence({
          id: "o2",
          startDate: "2026-01-12T00:00:00.000Z",
          endDate: "2026-01-12T00:00:00.000Z",
          minDaysToNext: 2,
        }),
      ],
    });
    const violations = minDaysToNextRule.validate(event, event.occurrences[1], {}, makeContext());
    expect(violations).toEqual([]);
  });
});
