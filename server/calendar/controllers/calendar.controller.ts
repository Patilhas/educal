import { calendarService } from "@/server/calendar/services/calendar.service";
import { fail, ok, readJson } from "@/server/shared/api-response";
import { DomainError } from "@/server/shared/domain-error";
import type { IRequestWithAuth } from "@/server/auth/session";

const parseEventId = (rawValue: string) => {
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError("VALIDATION_ERROR", 400, "eventId inválido");
  }

  return value;
};

const parseAcademicYearStart = (rawValue: string) => {
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError("VALIDATION_ERROR", 400, "academicYearStart inválido");
  }

  return value;
};

export const calendarController = {
  async listEnums() {
    try {
      return ok(await calendarService.listEnums());
    } catch (error) {
      return fail(error);
    }
  },

  async listEvents() {
    try {
      return ok(await calendarService.listEvents());
    } catch (error) {
      return fail(error);
    }
  },

  async createEvent(request: IRequestWithAuth) {
    try {
      const payload = await readJson(request);
      return ok(await calendarService.createEvent(request, payload), 201);
    } catch (error) {
      return fail(error);
    }
  },

  async updateEvent(request: IRequestWithAuth, eventIdValue: string) {
    try {
      const eventId = parseEventId(eventIdValue);
      const payload = await readJson(request);
      return ok(await calendarService.updateEvent(request, eventId, payload));
    } catch (error) {
      return fail(error);
    }
  },

  async deleteEvent(request: IRequestWithAuth, eventIdValue: string) {
    try {
      const eventId = parseEventId(eventIdValue);
      await calendarService.deleteEvent(request, eventId);
      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  },

  async patchOccurrence(
    request: IRequestWithAuth,
    eventIdValue: string,
    occurrenceId: string,
  ) {
    try {
      const eventId = parseEventId(eventIdValue);
      const payload = await readJson(request);
      return ok(await calendarService.updateOccurrence(request, eventId, occurrenceId, payload));
    } catch (error) {
      return fail(error);
    }
  },

  async validateAcademicYear(request: IRequestWithAuth) {
    try {
      const academicYearStart = parseAcademicYearStart(
        new URL(request.url).searchParams.get("academicYearStart") ??
          new Date().getFullYear().toString(),
      );

      return ok(await calendarService.validateAcademicYear(academicYearStart));
    } catch (error) {
      return fail(error);
    }
  },

  async migrateAcademicYear(request: IRequestWithAuth) {
    try {
      const payload = await readJson<{ academicYearStart: number }>(request);
      const academicYearStart = parseAcademicYearStart(String(payload.academicYearStart));

      return ok(await calendarService.migrateAcademicYear(request, academicYearStart), 201);
    } catch (error) {
      return fail(error);
    }
  },
};
