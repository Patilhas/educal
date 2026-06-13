import type {
  IAcademicYearMigrationResult,
  IAcademicYearValidationResult,
  IEvent,
  IEventEnums,
  IVacationPeriod,
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

export const createVacationRequest = async (
  academicYearStart: number,
  payload: { label: string; startDate: string; endDate: string },
): Promise<IVacationPeriod> => {
  return requestJson<IVacationPeriod>("/api/events/academic-year/vacations", {
    method: "POST",
    body: JSON.stringify({ academicYearStart, ...payload }),
  });
};

export const updateVacationRequest = async (
  academicYearStart: number,
  vacationId: string,
  payload: { label: string; startDate: string; endDate: string },
): Promise<IVacationPeriod> => {
  return requestJson<IVacationPeriod>(`/api/events/academic-year/vacations/${vacationId}`, {
    method: "PUT",
    body: JSON.stringify({ academicYearStart, ...payload }),
  });
};

export const deleteVacationRequest = async (
  academicYearStart: number,
  vacationId: string,
): Promise<{ deleted: boolean }> => {
  return requestJson<{ deleted: boolean }>(
    `/api/events/academic-year/vacations/${vacationId}?academicYearStart=${academicYearStart}`,
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

