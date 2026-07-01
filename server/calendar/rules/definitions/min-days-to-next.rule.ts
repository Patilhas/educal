import { parseISO } from "date-fns";
import type { IRuleDefinition, IRuleViolation } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { countWorkingDaysBetween } from "@/server/calendar/rules/utils/working-days";

export const minDaysToNextRule: IRuleDefinition = {
  id: "minDaysToNext",
  hidden: true,
  fields: [],
  translations: {
    pt: {
      label: "Dias úteis para a próxima ocorrência",
      fields: {},
      fieldLabels: {},
      messages: {
        gapTooShort:
          "Intervalo insuficiente para a próxima ocorrência: necessário {required} dia(s) útil(eis), encontrado(s) {actual}",
      },
    },
  },
  validate(event: IEvent, occurrence: IOccurrence): IRuleViolation[] {
    if (!occurrence.minDaysToNext) return [];
    const sortedOccs = [...event.occurrences].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    const idx = sortedOccs.findIndex((o) => o.id === occurrence.id);
    const next = sortedOccs[idx + 1];
    if (!next) return [];
    const gap = countWorkingDaysBetween(parseISO(occurrence.endDate), parseISO(next.startDate));
    if (gap < occurrence.minDaysToNext) {
      return [
        {
          date: occurrence.endDate,
          messageKey: "gapTooShort",
          messageParams: {
            required: String(occurrence.minDaysToNext),
            actual: String(gap),
          },
        },
      ];
    }
    return [];
  },
};
