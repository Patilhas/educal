import {
  differenceInDays,
  endOfDay,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { MonthEventBadge } from "@/features/calendar/views/month-view/month-event-badge";

interface IProps {
  selectedDate: Date;
  multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export function DayViewMultiDayEventsRow({
  selectedDate,
  multiDayOccurrences,
}: IProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const multiDayOccurrencesInDay = multiDayOccurrences
    .filter(({ occurrence }) => {
      const occurrenceStart = parseISO(occurrence.startDate);
      const occurrenceEnd = parseISO(occurrence.endDate);

      return (
        isWithinInterval(dayStart, { start: occurrenceStart, end: occurrenceEnd }) ||
        isWithinInterval(dayEnd, { start: occurrenceStart, end: occurrenceEnd }) ||
        (occurrenceStart <= dayStart && occurrenceEnd >= dayEnd)
      );
    })
    .sort((a, b) => {
      const durationA = differenceInDays(
        parseISO(a.occurrence.endDate),
        parseISO(a.occurrence.startDate),
      );
      const durationB = differenceInDays(
        parseISO(b.occurrence.endDate),
        parseISO(b.occurrence.startDate),
      );
      return durationB - durationA;
    });

  if (multiDayOccurrencesInDay.length === 0) return null;

  return (
    <div className="flex border-b">
      <div className="w-18"></div>
      <div className="flex flex-1 flex-col gap-1 border-l py-1">
        {multiDayOccurrencesInDay.map(({ event, occurrence }) => {
          const occurrenceStart = startOfDay(parseISO(occurrence.startDate));
          const occurrenceEnd = startOfDay(parseISO(occurrence.endDate));
          const currentDate = startOfDay(selectedDate);

          const occurrenceTotalDays = differenceInDays(occurrenceEnd, occurrenceStart) + 1;
          const occurrenceCurrentDay = differenceInDays(currentDate, occurrenceStart) + 1;

          return (
            <MonthEventBadge
              key={occurrence.id}
              event={event}
              occurrence={occurrence}
              cellDate={selectedDate}
              occurrenceCurrentDay={occurrenceCurrentDay}
              occurrenceTotalDays={occurrenceTotalDays}
            />
          );
        })}
      </div>
    </div>
  );
}
