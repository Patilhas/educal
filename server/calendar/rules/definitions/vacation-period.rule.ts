import { parseISO, isWithinInterval, areIntervalsOverlapping } from "date-fns";
import type { IRuleDefinition, IRuleValidationContext, IRuleViolation } from "../types";
import type { IEvent, IOccurrence, IVacationPeriod } from "@/shared/calendar/types";
import { runDayRangeCheck } from "../utils/day-range-check";

type VacationPeriodConfig = { checkStart: boolean; checkEnd: boolean; checkRange: boolean };
const MESSAGE_KEYS = {
  start: "startInVacation",
  end: "endInVacation",
  range: "rangeOverlapsVacation",
} as const;

// Normalize a datetime to its UTC calendar date (midnight UTC), so occurrence
// times don't affect date-level comparisons with vacation ranges.
const toUtcDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

function vacationContaining(day: Date, vacations: IVacationPeriod[]): IVacationPeriod | undefined {
  return vacations.find((v) =>
    isWithinInterval(day, { start: parseISO(v.startDate), end: parseISO(v.endDate) }),
  );
}

function vacationOverlapping(start: Date, end: Date, vacations: IVacationPeriod[]): IVacationPeriod | undefined {
  return vacations.find((v) =>
    areIntervalsOverlapping(
      { start, end },
      { start: parseISO(v.startDate), end: parseISO(v.endDate) },
      { inclusive: true },
    ),
  );
}

export const vacationPeriodRule: IRuleDefinition = {
  id: "vacationPeriod",
  fields: [
    { id: "checkStart", type: "checkbox", defaultValue: true },
    { id: "checkEnd",   type: "checkbox", defaultValue: true },
    { id: "checkRange", type: "checkbox", defaultValue: false },
  ],
  translations: {
    pt: {
      label: "Período de férias letivas",
      fields: {
        checkStart: "Verificar início",
        checkEnd: "Verificar fim",
        checkRange: "Verificar período",
      },
      fieldLabels: {
        start: "Início",
        end: "Fim",
        range: "Período",
      },
      messages: {
        startInVacation: 'O início coincide com o período de férias "{vacationLabel}"',
        endInVacation: 'O fim coincide com o período de férias "{vacationLabel}"',
        rangeOverlapsVacation: 'O período sobrepõe-se com as férias "{vacationLabel}"',
      },
    },
  },
  validate(
    _event: IEvent,
    occurrence: IOccurrence,
    config: Record<string, unknown>,
    context: IRuleValidationContext,
  ): IRuleViolation[] {
    const { vacations } = context;
    if (!vacations || vacations.length === 0) return [];

    return runDayRangeCheck({
      occurrence,
      config: config as VacationPeriodConfig,
      matchDay: (day) => vacationContaining(toUtcDay(day), vacations),
      matchRange: (start, end) => vacationOverlapping(toUtcDay(start), toUtcDay(end), vacations),
      toViolation: (field, date, match) => ({
        fieldLabelKey: field,
        date,
        messageKey: MESSAGE_KEYS[field],
        messageParams: { vacationLabel: match.label },
      }),
    });
  },
};
