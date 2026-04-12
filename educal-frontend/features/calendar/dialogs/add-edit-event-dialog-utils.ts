import { addMinutes, format, set } from "date-fns";
import type { IEvent, IUser } from "@/features/calendar/interfaces";
import type { TEventFormData } from "@/features/calendar/schemas";

interface InitialDateParams {
  event?: IEvent;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}

interface EventFromFormParams {
  values: TEventFormData;
  isEditing: boolean;
  event?: IEvent;
  defaultUser: IUser;
}

export const toNumericId = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) || 1;
};

export const getInitialDates = ({
  event,
  startDate,
  startTime,
}: InitialDateParams) => {
  if (event?.occurrences?.length) {
    return {
      startDate: new Date(event.occurrences[0].startDate),
      endDate: new Date(event.occurrences[0].endDate),
    };
  }

  if (!startDate) {
    const now = new Date();
    return { startDate: now, endDate: addMinutes(now, 30) };
  }

  const start = startTime
    ? set(new Date(startDate), {
        hours: startTime.hour,
        minutes: startTime.minute,
        seconds: 0,
      })
    : new Date(startDate);

  return { startDate: start, endDate: addMinutes(start, 30) };
};

export const getEventFormDefaults = (
  event: IEvent | undefined,
  initialDates: { startDate: Date; endDate: Date },
): TEventFormData => {
  return {
    name: event?.name ?? "",
    objective: event?.objective ?? "",
    daysBetweenOccurrences: event?.daysBetweenOccurrences ?? "",
    category: event?.category ?? "",
    classification: event?.classification ?? "",
    status: event?.status ?? "",
    responsible: event?.responsible ?? "",
    occurrences:
      event?.occurrences?.map((occurrence) => ({
        id: occurrence.id,
        description: occurrence.description,
        startDate: new Date(occurrence.startDate),
        endDate: new Date(occurrence.endDate),
      })) ?? [
        {
          id: crypto.randomUUID(),
          description: "",
          startDate: initialDates.startDate,
          endDate: initialDates.endDate,
        },
      ],
  };
};

export const toInputDate = (date: Date) => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
};

export const formatEventFromForm = ({
  values,
  isEditing,
  event,
  defaultUser,
}: EventFromFormParams): IEvent => {
  const sortedOccurrences = [...values.occurrences].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  const id = isEditing
    ? (event?.id ?? toNumericId(values.name))
    : toNumericId(sortedOccurrences[0]?.id ?? values.name);

  return {
    id,
    name: values.name,
    objective: values.objective,
    daysBetweenOccurrences: values.daysBetweenOccurrences,
    category: values.category,
    classification: values.classification,
    status: values.status,
    responsible: values.responsible,
    occurrences: sortedOccurrences.map((occurrence) => ({
      id: occurrence.id,
      description: occurrence.description,
      startDate: format(occurrence.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(occurrence.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
    })),
    user: isEditing && event ? event.user : defaultUser,
  };
};

