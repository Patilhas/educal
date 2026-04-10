import { calendarService } from "@/server/calendar/services/calendar.service";
import { fail, ok, readJson } from "@/server/shared/api-response";
import { DomainError } from "@/server/shared/domain-error";

const parseEventId = (rawValue: string) => {
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError("VALIDATION_ERROR", 400, "eventId inválido");
  }

  return value;
};

export const calendarController = {
  async listUsers() {
    try {
      return ok(await calendarService.listUsers());
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

  async createEvent(request: Request) {
    try {
      const payload = await readJson(request);
      return ok(await calendarService.createEvent(payload), 201);
    } catch (error) {
      return fail(error);
    }
  },

  async updateEvent(request: Request, eventIdValue: string) {
    try {
      const eventId = parseEventId(eventIdValue);
      const payload = await readJson(request);
      return ok(await calendarService.updateEvent(eventId, payload));
    } catch (error) {
      return fail(error);
    }
  },

  async deleteEvent(eventIdValue: string) {
    try {
      const eventId = parseEventId(eventIdValue);
      await calendarService.deleteEvent(eventId);
      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  },

  async patchOccurrence(
    request: Request,
    eventIdValue: string,
    occurrenceId: string,
  ) {
    try {
      const eventId = parseEventId(eventIdValue);
      const payload = await readJson(request);
      return ok(await calendarService.updateOccurrence(eventId, occurrenceId, payload));
    } catch (error) {
      return fail(error);
    }
  },
};


