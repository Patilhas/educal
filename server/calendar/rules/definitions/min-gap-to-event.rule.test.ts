import { describe, it, expect } from "vitest";
import { minGapToEventRule } from "./min-gap-to-event.rule";
import { makeEvent, makeOccurrence, makeContext } from "./__fixtures__/builders";

describe("minGapToEventRule", () => {
  it("flags an insufficient working-day gap to the target event's first occurrence", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-05T00:00:00.000Z" }),
      ],
    });
    const eventB = makeEvent({
      id: 2,
      name: "Event B",
      occurrences: [
        makeOccurrence({ id: "b1", startDate: "2026-01-12T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = minGapToEventRule.validate(
      eventA,
      eventA.occurrences[0],
      { constraints: [{ eventId: 2, minWorkingDays: 5 }] },
      makeContext({ allEvents: [eventA, eventB] }),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "gap",
        date: "2026-01-05T00:00:00.000Z",
        messageKey: "insufficientGap",
        messageParams: { eventName: "Event B", required: "5", actual: "4" },
      },
    ]);
  });

  it("does not flag a sufficient working-day gap", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-05T00:00:00.000Z" }),
      ],
    });
    const eventB = makeEvent({
      id: 2,
      occurrences: [
        makeOccurrence({ id: "b1", startDate: "2026-01-12T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = minGapToEventRule.validate(
      eventA,
      eventA.occurrences[0],
      { constraints: [{ eventId: 2, minWorkingDays: 3 }] },
      makeContext({ allEvents: [eventA, eventB] }),
    );
    expect(violations).toEqual([]);
  });

  it("skips a constraint with no minWorkingDays", () => {
    const eventA = makeEvent({ id: 1 });
    const violations = minGapToEventRule.validate(
      eventA,
      eventA.occurrences[0],
      { constraints: [{ eventId: 2, minWorkingDays: 0 }] },
      makeContext({ allEvents: [eventA] }),
    );
    expect(violations).toEqual([]);
  });

  it("skips a constraint whose target event cannot be found", () => {
    const eventA = makeEvent({ id: 1 });
    const violations = minGapToEventRule.validate(
      eventA,
      eventA.occurrences[0],
      { constraints: [{ eventId: 999, minWorkingDays: 5 }] },
      makeContext({ allEvents: [eventA] }),
    );
    expect(violations).toEqual([]);
  });

  it("only evaluates the last occurrence of the event, by sorted start date", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-05T00:00:00.000Z" }),
        makeOccurrence({ id: "a2", startDate: "2026-01-06T00:00:00.000Z", endDate: "2026-01-06T00:00:00.000Z" }),
      ],
    });
    const eventB = makeEvent({
      id: 2,
      occurrences: [
        makeOccurrence({ id: "b1", startDate: "2026-01-12T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = minGapToEventRule.validate(
      eventA,
      eventA.occurrences[0],
      { constraints: [{ eventId: 2, minWorkingDays: 5 }] },
      makeContext({ allEvents: [eventA, eventB] }),
    );
    expect(violations).toEqual([]);
  });

  it("returns no violations when constraints is empty", () => {
    const eventA = makeEvent();
    const violations = minGapToEventRule.validate(eventA, eventA.occurrences[0], { constraints: [] }, makeContext());
    expect(violations).toEqual([]);
  });
});
