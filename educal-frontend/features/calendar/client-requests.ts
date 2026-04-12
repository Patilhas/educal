import type { IEvent, IEventEnums } from "@/features/calendar/interfaces";

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

interface ApiSuccessPayload<T> {
  data: T;
}

const getErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as ApiErrorPayload;
    return body.error?.message ?? "Falha ao comunicar com o backend";
  } catch {
    return "Falha ao comunicar com o backend";
  }
};

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as ApiSuccessPayload<T>;
  return body.data;
};

export const fetchEventEnums = async (): Promise<IEventEnums> => {
  return request<IEventEnums>("/api/events/enums");
};

export const createEventRequest = async (event: IEvent) => {
  return request<IEvent>("/api/events", {
    method: "POST",
    body: JSON.stringify({
      ...event,
      userId: event.user.id,
    }),
  });
};

export const updateEventRequest = async (event: IEvent) => {
  return request<IEvent>(`/api/events/${event.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...event,
      userId: event.user.id,
    }),
  });
};

export const deleteEventRequest = async (eventId: number) => {
  return request<{ deleted: boolean }>(`/api/events/${eventId}`, {
    method: "DELETE",
  });
};

export const updateOccurrenceRequest = async ({
  eventId,
  occurrenceId,
  startDate,
  endDate,
  description,
}: {
  eventId: number;
  occurrenceId: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}) => {
  return request<IEvent>(`/api/events/${eventId}/occurrences/${occurrenceId}`, {
    method: "PATCH",
    body: JSON.stringify({
      startDate,
      endDate,
      description,
    }),
  });
};

