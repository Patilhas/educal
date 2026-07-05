import { describe, it, expect } from "vitest";
import { vacationPeriodRule } from "./vacation-period.rule";
import { makeEvent, makeOccurrence, makeVacationPeriod, makeContext } from "./__fixtures__/builders";

const baseConfig = { checkStart: false, checkEnd: false, checkRange: false };
const vacation = makeVacationPeriod({
  label: "Férias de Natal",
  startDate: "2026-12-20T00:00:00.000Z",
  endDate: "2027-01-04T00:00:00.000Z",
});

describe("vacationPeriodRule", () => {
  it("flags a start date that falls inside a vacation period", () => {
    const occurrence = makeOccurrence({ startDate: "2026-12-25T10:00:00.000Z" });
    const violations = vacationPeriodRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext({ vacations: [vacation] }),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "start",
        date: "2026-12-25T10:00:00.000Z",
        messageKey: "startInVacation",
        messageParams: { vacationLabel: "Férias de Natal" },
      },
    ]);
  });

  it("does not flag a start date outside every vacation period", () => {
    const occurrence = makeOccurrence({ startDate: "2026-11-01T00:00:00.000Z" });
    const violations = vacationPeriodRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext({ vacations: [vacation] }),
    );
    expect(violations).toEqual([]);
  });

  it("returns no violations when no vacation periods are configured", () => {
    const occurrence = makeOccurrence({ startDate: "2026-12-25T10:00:00.000Z" });
    const violations = vacationPeriodRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkStart: true },
      makeContext({ vacations: [] }),
    );
    expect(violations).toEqual([]);
  });

  it("flags an end date exactly on the vacation period boundary", () => {
    const occurrence = makeOccurrence({ endDate: "2027-01-04T00:00:00.000Z" });
    const violations = vacationPeriodRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkEnd: true },
      makeContext({ vacations: [vacation] }),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "end",
        date: "2027-01-04T00:00:00.000Z",
        messageKey: "endInVacation",
        messageParams: { vacationLabel: "Férias de Natal" },
      },
    ]);
  });

  it("flags a range that overlaps a vacation period without either endpoint being inside it", () => {
    const occurrence = makeOccurrence({
      startDate: "2026-12-15T00:00:00.000Z",
      endDate: "2027-01-10T00:00:00.000Z",
    });
    const violations = vacationPeriodRule.validate(
      makeEvent(),
      occurrence,
      { ...baseConfig, checkRange: true },
      makeContext({ vacations: [vacation] }),
    );
    expect(violations).toEqual([
      {
        fieldLabelKey: "range",
        date: "2026-12-15T00:00:00.000Z",
        messageKey: "rangeOverlapsVacation",
        messageParams: { vacationLabel: "Férias de Natal" },
      },
    ]);
  });
});
