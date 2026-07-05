import { describe, it, expect } from "vitest";
import { getRulesMetadata, validateEventRule, SERVER_RULES } from "./index";
import { makeEvent, makeOccurrence, makeContext } from "./definitions/__fixtures__/builders";

describe("getRulesMetadata", () => {
  it("returns one metadata entry per registered rule, without the validate function", () => {
    const metadata = getRulesMetadata();
    expect(metadata).toHaveLength(SERVER_RULES.length);
    for (const entry of metadata) {
      expect(entry).not.toHaveProperty("validate");
    }
    expect(metadata.map((m) => m.id)).toEqual(SERVER_RULES.map((r) => r.id));
  });
});

describe("validateEventRule", () => {
  it("returns no violations for an unknown rule type", () => {
    const event = makeEvent();
    const violations = validateEventRule(
      { type: "not-a-real-rule", config: {} },
      event,
      event.occurrences[0],
      makeContext(),
    );
    expect(violations).toEqual([]);
  });

  it("dispatches to the matching rule definition's validate function", () => {
    const event = makeEvent();
    const occurrence = makeOccurrence({
      startDate: "2026-01-10T00:00:00.000Z", // Saturday
      endDate: "2026-01-10T00:00:00.000Z",
    });
    const violations = validateEventRule(
      { type: "weekend", config: { checkStart: true, checkEnd: false, checkRange: false } },
      event,
      occurrence,
      makeContext(),
    );
    expect(violations).toEqual([
      { fieldLabelKey: "start", date: "2026-01-10T00:00:00.000Z", messageKey: "startIsWeekend" },
    ]);
  });
});
