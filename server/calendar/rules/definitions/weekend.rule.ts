import { parseISO, isWeekend, eachDayOfInterval } from "date-fns";
import type { IRuleDefinition, IRuleViolation } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";

type WeekendConfig = { checkStart: boolean; checkEnd: boolean; checkRange: boolean };

export const weekendRule: IRuleDefinition = {
  id: "weekend",
  fields: [
    { id: "checkStart", type: "checkbox", defaultValue: true },
    { id: "checkEnd",   type: "checkbox", defaultValue: true },
    { id: "checkRange", type: "checkbox", defaultValue: false },
  ],
  translations: {
    pt: {
      label: "Fim de semana",
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
        startIsWeekend: "O início coincide com um fim de semana",
        endIsWeekend: "O fim coincide com um fim de semana",
        rangeHasWeekend: "O período inclui um dia de fim de semana",
      },
    },
  },
  validate(_event: IEvent, occurrence: IOccurrence, config: Record<string, unknown>): IRuleViolation[] {
    const { checkStart, checkEnd, checkRange } = config as WeekendConfig;
    const violations: IRuleViolation[] = [];

    if (checkStart && isWeekend(parseISO(occurrence.startDate))) {
      violations.push({ fieldLabelKey: "start", date: occurrence.startDate, messageKey: "startIsWeekend" });
    }
    if (checkEnd && isWeekend(parseISO(occurrence.endDate))) {
      violations.push({ fieldLabelKey: "end", date: occurrence.endDate, messageKey: "endIsWeekend" });
    }
    if (checkRange) {
      for (const day of eachDayOfInterval({ start: parseISO(occurrence.startDate), end: parseISO(occurrence.endDate) })) {
        if (isWeekend(day)) {
          violations.push({ fieldLabelKey: "range", date: day.toISOString(), messageKey: "rangeHasWeekend" });
          break;
        }
      }
    }

    return violations;
  },
};
