import { describe, it, expect } from "vitest";
import { holidayRule } from "./holiday.rule";
import { makeEvent, makeOccurrence, makeContext } from "./__fixtures__/builders";

const baseConfig = { checkStart: false, checkEnd: false, checkRange: false };

describe("holidayRule", () => {
  it("flags a start date that falls on a public holiday", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-04-25T12:00:00.000Z", // Dia da Liberdade
      endDate: "2026-04-25T12:00:00.000Z",
    });
    const violations = holidayRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext(),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "start",
        date: "2026-04-25T12:00:00.000Z",
        messageKey: "startIsHoliday",
        messageParams: { holidayName: "Dia da Liberdade" },
      },
    ]);
  });

  it("does not flag a start date that is not a holiday", () => {
    const occurrence = makeOccurrence({ startDate: "2026-01-05T12:00:00.000Z" });
    const violations = holidayRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext(),
    );
    expect(violations).toEqual([]);
  });

  it("flags an end date that falls on a public holiday", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-01-05T12:00:00.000Z",
      endDate: "2026-12-25T12:00:00.000Z", // Natal
    });
    const violations = holidayRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkEnd: true },
      makeContext(),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "end",
        date: "2026-12-25T12:00:00.000Z",
        messageKey: "endIsHoliday",
        messageParams: { holidayName: "Natal" },
      },
    ]);
  });

  it("flags the first holiday found within the range and stops there", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-12-24T12:00:00.000Z", // Noite de Natal (observance)
      endDate: "2026-12-26T12:00:00.000Z",
    });
    const violations = holidayRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkRange: true },
      makeContext(),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "range",
        date: "2026-12-24T00:00:00.000Z",
        messageKey: "rangeHasHoliday",
        messageParams: { holidayName: "Noite de Natal" },
      },
    ]);
  });

  it("returns no violations when all flags are false", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-04-25T12:00:00.000Z",
      endDate: "2026-12-25T12:00:00.000Z",
    });
    const violations = holidayRule.validate(makeEvent(), occurrence, baseConfig, makeContext());
    expect(violations).toEqual([]);
  });
});
