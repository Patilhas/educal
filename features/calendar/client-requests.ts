import type {
  IAlert,
  IEvent,
  IEventEnums,
} from "@/shared/calendar/types"
import { requestJson } from "@/lib/api-client";

export const fetchEventEnums = async (): Promise<IEventEnums> => {
  return requestJson<IEventEnums>("/api/events/enums");
};

export const createEventRequest = async (event: IEvent) => {
  return requestJson<IEvent>("/api/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
};

export const updateEventRequest = async (event: IEvent) => {
  return requestJson<IEvent>(`/api/events/${event.id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });
};

export const deleteEventRequest = async (eventId: number) => {
  return requestJson<{ deleted: boolean }>(`/api/events/${eventId}`, {
    method: "DELETE",
  });
};

export const updateOccurrenceRequest = async ({
  eventId,
  occurrenceId,
  startDate,
  endDate,
  description,
  alerts,
}: {
  eventId: number;
  occurrenceId: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  alerts?: IAlert[];
}) => {
  return requestJson<IEvent>(`/api/events/${eventId}/occurrences/${occurrenceId}`, {
    method: "PATCH",
    body: JSON.stringify({
      startDate,
      endDate,
      description,
      alerts,
    }),
  });
};

export const markNotificationReadRequest = async (notificationId: string): Promise<void> => {
  await requestJson<{ ok: boolean }>("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ notificationId }),
  });
};
