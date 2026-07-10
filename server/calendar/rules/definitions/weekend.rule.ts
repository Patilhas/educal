import { isWeekend } from "date-fns";
import type { IRuleDefinition, IRuleViolation } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { runDayRangeCheck } from "../utils/day-range-check";

const MESSAGE_KEYS = { start: "startIsWeekend", end: "endIsWeekend", range: "rangeHasWeekend" } as const;

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
    return runDayRangeCheck<true>({
      occurrence,
      config: config as WeekendConfig,
      matchDay: (day) => (isWeekend(day) ? true : undefined),
      toViolation: (field, date) => ({ fieldLabelKey: field, date, messageKey: MESSAGE_KEYS[field] }),
    });
  },
};
