import { parseISO } from "date-fns";
import type { IRuleDefinition, IRuleViolation, IRuleValidationContext } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { countWorkingDaysBetween } from "@/server/calendar/rules/utils/working-days";

export type EventGapConstraint = { eventId: number; minWorkingDays: number };
type MinGapToEventConfig = { constraints: EventGapConstraint[] };

export const minGapToEventRule: IRuleDefinition = {
  id: "minGapToEvent",
  fields: [
    { id: "constraints", type: "event-constraints", defaultValue: [] },
  ],
  translations: {
    pt: {
      label: "Período mínimo entre eventos",
      fields: { constraints: "Eventos e períodos mínimos" },
      fieldLabels: { gap: "Intervalo" },
      messages: {
        insufficientGap: 'Intervalo insuficiente para "{eventName}": necessário {required} dia(s) útil(eis), encontrado(s) {actual}',
      },
    },
  },
  validate(event: IEvent, occurrence: IOccurrence, config: Record<string, unknown>, context: IRuleValidationContext): IRuleViolation[] {
    const { constraints } = config as MinGapToEventConfig;
    if (!constraints?.length) return [];

    const sortedOccs = [...event.occurrences].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    const lastOcc = sortedOccs[sortedOccs.length - 1];
    if (occurrence.id !== lastOcc?.id) return [];

    const lastOccEnd = parseISO(lastOcc.endDate);
    const violations: IRuleViolation[] = [];

    for (const { eventId, minWorkingDays } of constraints) {
      if (!minWorkingDays) continue;
      const targetEvent = context.allEvents.find((e) => e.id === eventId);
      if (!targetEvent || !targetEvent.occurrences.length) continue;

      const sortedTargetOccs = [...targetEvent.occurrences].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
      const targetFirstStart = parseISO(sortedTargetOccs[0].startDate);

      const gap = countWorkingDaysBetween(lastOccEnd, targetFirstStart);
      if (gap < minWorkingDays) {
        violations.push({
          fieldLabelKey: "gap",
          date: lastOcc.endDate,
          messageKey: "insufficientGap",
          messageParams: {
            eventName: targetEvent.name,
            required: String(minWorkingDays),
            actual: String(gap),
          },
        });
      }
    }

    return violations;
  },
};
