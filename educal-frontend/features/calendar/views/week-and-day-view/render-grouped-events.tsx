import { areIntervalsOverlapping, parseISO } from "date-fns";
import { getOccurrenceBlockStyle } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { EventBlock } from "@/features/calendar/views/week-and-day-view/event-block";

interface RenderGroupedEventsProps {
  groupedOccurrences: { event: IEvent; occurrence: IOccurrence }[][];
  day: Date;
}

export function RenderGroupedEvents({
  groupedOccurrences,
  day,
}: RenderGroupedEventsProps) {
  return groupedOccurrences.map((group, groupIndex) =>
    group.map(({ event, occurrence }) => {
      let style = getOccurrenceBlockStyle(
        occurrence,
        day,
        groupIndex,
        groupedOccurrences.length,
      );
      const hasOverlap = groupedOccurrences.some(
        (otherGroup, otherIndex) =>
          otherIndex !== groupIndex &&
          otherGroup.some(({ occurrence: otherOccurrence }) =>
            areIntervalsOverlapping(
              {
                start: parseISO(occurrence.startDate),
                end: parseISO(occurrence.endDate),
              },
              {
                start: parseISO(otherOccurrence.startDate),
                end: parseISO(otherOccurrence.endDate),
              },
            ),
          ),
      );

      if (!hasOverlap) style = { ...style, width: "100%", left: "0%" };

      return (
        <div key={occurrence.id} className="absolute p-1" style={style}>
          <EventBlock event={event} occurrence={occurrence} />
        </div>
      );
    }),
  );
}
