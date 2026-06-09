import type {
  IAcademicYearMigrationResult,
  IAcademicYearValidationResult,
  IEvent,
  IEventEnums,
  IHolidayPeriod,
} from "@/shared/calendar/types";
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

export const validateAcademicYearRequest = async (
  academicYearStart: number,
): Promise<IAcademicYearValidationResult> => {
  return requestJson<IAcademicYearValidationResult>(
    `/api/events/academic-year?academicYearStart=${academicYearStart}`,
  );
};

export const migrateAcademicYearRequest = async (
  academicYearStart: number,
): Promise<IAcademicYearMigrationResult> => {
  return requestJson<IAcademicYearMigrationResult>("/api/events/academic-year", {
    method: "POST",
    body: JSON.stringify({ academicYearStart }),
  });
};

export const createHolidayRequest = async (
  academicYearStart: number,
  payload: { label: string; startDate: string; endDate: string },
): Promise<IHolidayPeriod> => {
  return requestJson<IHolidayPeriod>("/api/events/academic-year/holidays", {
    method: "POST",
    body: JSON.stringify({ academicYearStart, ...payload }),
  });
};

export const updateHolidayRequest = async (
  academicYearStart: number,
  holidayId: string,
  payload: { label: string; startDate: string; endDate: string },
): Promise<IHolidayPeriod> => {
  return requestJson<IHolidayPeriod>(`/api/events/academic-year/holidays/${holidayId}`, {
    method: "PUT",
    body: JSON.stringify({ academicYearStart, ...payload }),
  });
};

export const deleteHolidayRequest = async (
  academicYearStart: number,
  holidayId: string,
): Promise<{ deleted: boolean }> => {
  return requestJson<{ deleted: boolean }>(
    `/api/events/academic-year/holidays/${holidayId}?academicYearStart=${academicYearStart}`,
    { method: "DELETE" },
  );
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
  return requestJson<IEvent>(`/api/events/${eventId}/occurrences/${occurrenceId}`, {
    method: "PATCH",
    body: JSON.stringify({
      startDate,
      endDate,
      description,
    }),
  });
};

