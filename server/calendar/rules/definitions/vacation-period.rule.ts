import { parseISO, isWithinInterval, areIntervalsOverlapping } from "date-fns";
import type { IRuleDefinition, IRuleValidationContext, IRuleViolation } from "../types";
import type { IEvent, IOccurrence, IVacationPeriod } from "@/shared/calendar/types";

type VacationPeriodConfig = { checkStart: boolean; checkEnd: boolean; checkRange: boolean };

// Normalize a datetime ISO string to its UTC calendar date (midnight UTC),
// so occurrence times don't affect date-level comparisons with vacation ranges.
const toUtcDay = (isoString: string): Date => {
  const d = parseISO(isoString);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

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
    const { checkStart, checkEnd, checkRange } = config as VacationPeriodConfig;
    const { vacations } = context;
    const violations: IRuleViolation[] = [];

    if (!vacations || vacations.length === 0) return violations;

    if (checkStart) {
      const v = vacationContaining(toUtcDay(occurrence.startDate), vacations);
      if (v) violations.push({ fieldLabelKey: "start", date: occurrence.startDate, messageKey: "startInVacation", messageParams: { vacationLabel: v.label } });
    }
    if (checkEnd) {
      const v = vacationContaining(toUtcDay(occurrence.endDate), vacations);
      if (v) violations.push({ fieldLabelKey: "end", date: occurrence.endDate, messageKey: "endInVacation", messageParams: { vacationLabel: v.label } });
    }
    if (checkRange) {
      const v = vacationOverlapping(toUtcDay(occurrence.startDate), toUtcDay(occurrence.endDate), vacations);
      if (v) violations.push({ fieldLabelKey: "range", date: occurrence.startDate, messageKey: "rangeOverlapsVacation", messageParams: { vacationLabel: v.label } });
    }

    return violations;
  },
};
