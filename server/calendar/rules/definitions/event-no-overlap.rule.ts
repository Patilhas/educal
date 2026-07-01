import { parseISO, areIntervalsOverlapping } from "date-fns";
import type { IRuleDefinition, IRuleViolation, IRuleValidationContext } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";

type EventNoOverlapConfig = { eventIds: number[] };

function getEventSpan(event: IEvent): { start: Date; end: Date } | null {
  if (!event.occurrences.length) return null;
  const sorted = [...event.occurrences].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
  return { start: parseISO(sorted[0].startDate), end: parseISO(sorted[sorted.length - 1].endDate) };
}

export const eventNoOverlapRule: IRuleDefinition = {
  id: "eventNoOverlap",
  fields: [
    { id: "eventIds", type: "event-multiselect", defaultValue: [] },
  ],
  translations: {
    pt: {
      label: "Sem sobreposição de eventos",
      fields: { eventIds: "Eventos a verificar" },
      fieldLabels: { span: "Intervalo" },
      messages: {
        overlapsWith: 'Sobrepõe-se com o evento "{eventName}"',
      },
    },
  },
  validate(event: IEvent, occurrence: IOccurrence, config: Record<string, unknown>, context: IRuleValidationContext): IRuleViolation[] {
    const { eventIds } = config as EventNoOverlapConfig;
    if (!eventIds?.length) return [];

    const sortedOccs = [...event.occurrences].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    if (occurrence.id !== sortedOccs[0]?.id) return [];

    const ownSpan = getEventSpan(event);
    if (!ownSpan) return [];

    const violations: IRuleViolation[] = [];

    for (const targetId of eventIds) {
      const targetEvent = context.allEvents.find((e) => e.id === targetId);
      if (!targetEvent) continue;
      const targetSpan = getEventSpan(targetEvent);
      if (!targetSpan) continue;

      if (areIntervalsOverlapping(ownSpan, targetSpan, { inclusive: true })) {
        violations.push({
          fieldLabelKey: "span",
          date: sortedOccs[0].startDate,
          messageKey: "overlapsWith",
          messageParams: { eventName: targetEvent.name },
        });
      }
    }

    return violations;
  },
};
