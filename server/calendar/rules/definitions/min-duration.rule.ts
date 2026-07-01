import { differenceInCalendarDays, parseISO } from "date-fns";
import type { IRuleDefinition, IRuleViolation } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";

export const minDurationRule: IRuleDefinition = {
  id: "minDuration",
  hidden: true,
  fields: [],
  translations: {
    pt: {
      label: "Duração mínima",
      fields: {},
      fieldLabels: {},
      messages: {
        durationTooShort:
          "Duração insuficiente: necessário {required} dia(s), encontrado(s) {actual}",
      },
    },
  },
  validate(_event: IEvent, occurrence: IOccurrence): IRuleViolation[] {
    if (!occurrence.minDays || occurrence.minDays <= 0) return [];
    const actual = differenceInCalendarDays(
      parseISO(occurrence.endDate),
      parseISO(occurrence.startDate),
    );
    if (actual < occurrence.minDays) {
      return [
        {
          date: occurrence.startDate,
          messageKey: "durationTooShort",
          messageParams: {
            required: String(occurrence.minDays),
            actual: String(actual),
          },
        },
      ];
    }
    return [];
  },
};
