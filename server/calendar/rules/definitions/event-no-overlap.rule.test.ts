import { describe, it, expect } from "vitest";
import { eventNoOverlapRule } from "./event-no-overlap.rule";
import { makeEvent, makeOccurrence, makeContext } from "./__fixtures__/builders";

describe("eventNoOverlapRule", () => {
  it("flags an overlap with a configured target event", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-06T00:00:00.000Z" }),
      ],
    });
    const eventB = makeEvent({
      id: 2,
      name: "Event B",
      occurrences: [
        makeOccurrence({ id: "b1", startDate: "2026-01-06T00:00:00.000Z", endDate: "2026-01-07T00:00:00.000Z" }),
      ],
    });
    const violations = eventNoOverlapRule.validate(
      eventA,
      eventA.occurrences[0],
      { eventIds: [2] },
      makeContext({ allEvents: [eventA, eventB] }),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "span",
        date: "2026-01-05T00:00:00.000Z",
        messageKey: "overlapsWith",
        messageParams: { eventName: "Event B" },
      },
    ]);
  });

  it("does not flag events whose spans do not overlap", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-06T00:00:00.000Z" }),
      ],
    });
    const eventC = makeEvent({
      id: 3,
      name: "Event C",
      occurrences: [
        makeOccurrence({ id: "c1", startDate: "2026-01-20T00:00:00.000Z", endDate: "2026-01-21T00:00:00.000Z" }),
      ],
    });
    const violations = eventNoOverlapRule.validate(
      eventA,
      eventA.occurrences[0],
      { eventIds: [3] },
      makeContext({ allEvents: [eventA, eventC] }),
    );
    expect(violations).toEqual([]);
  });

  it("only evaluates the first occurrence of the event, by sorted start date", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-06T00:00:00.000Z" }),
        makeOccurrence({ id: "a2", startDate: "2026-01-10T00:00:00.000Z", endDate: "2026-01-11T00:00:00.000Z" }),
      ],
    });
    const violations = eventNoOverlapRule.validate(
      eventA,
      eventA.occurrences[1],
      { eventIds: [2] },
      makeContext({ allEvents: [eventA] }),
    );
    expect(violations).toEqual([]);
  });

  it("returns no violations when eventIds is empty", () => {
    const eventA = makeEvent();
    const violations = eventNoOverlapRule.validate(eventA, eventA.occurrences[0], { eventIds: [] }, makeContext());
    expect(violations).toEqual([]);
  });

  it("returns no violations when a configured target event cannot be found", () => {
    const eventA = makeEvent();
    const violations = eventNoOverlapRule.validate(
      eventA,
      eventA.occurrences[0],
      { eventIds: [999] },
      makeContext({ allEvents: [eventA] }),
    );
    expect(violations).toEqual([]);
  });

  it("computes the event span across multiple occurrences, using the earliest start and latest end", () => {
    const eventA = makeEvent({
      id: 1,
      occurrences: [
        makeOccurrence({ id: "a2", startDate: "2026-01-10T00:00:00.000Z", endDate: "2026-01-11T00:00:00.000Z" }),
        makeOccurrence({ id: "a1", startDate: "2026-01-05T00:00:00.000Z", endDate: "2026-01-06T00:00:00.000Z" }),
      ],
    });
    const eventB = makeEvent({
      id: 2,
      name: "Event B",
      occurrences: [
        makeOccurrence({ id: "b1", startDate: "2026-01-11T00:00:00.000Z", endDate: "2026-01-12T00:00:00.000Z" }),
      ],
    });
    const violations = eventNoOverlapRule.validate(
      eventA,
      eventA.occurrences[1],
      { eventIds: [2] },
      makeContext({ allEvents: [eventA, eventB] }),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "span",
        date: "2026-01-05T00:00:00.000Z",
        messageKey: "overlapsWith",
        messageParams: { eventName: "Event B" },
      },
    ]);
  });
});
