import { z } from "zod";
import type { IEvent, IOccurrence, IUser } from "@/features/calendar/interfaces";
import {
  buildEventPayloadSchema,
  patchOccurrenceSchema,
} from "@/server/calendar/schemas";
import { calendarData } from "@/server/calendar/data/calendar.data";
import { DomainError } from "@/server/shared/domain-error";

const toIsoString = (dateValue: string) => new Date(dateValue).toISOString();

export class CalendarService {
  async listUsers(): Promise<IUser[]> {
    return calendarData.listUsers();
  }

  async listEvents(): Promise<IEvent[]> {
    return calendarData.listEvents();
  }

  async listEnums() {
    const [categories, classifications, statuses, responsibles] =
      await Promise.all([
        calendarData.listCategories(),
        calendarData.listClassifications(),
        calendarData.listStatuses(),
        calendarData.listResponsibles(),
      ]);

    return {
      categories,
      classifications: classifications.map((c) => c.value),
      statuses: statuses.map((s) => s.name),
      responsibles: responsibles.map((r) => r.value),
    };
  }

  async createEvent(payload: unknown): Promise<IEvent> {
    const schema = await buildEventPayloadSchema();
    const parsed = schema.parse(payload);
    const user = await this.resolveUser(parsed.userId);

    const newEvent: IEvent = {
      id: await this.generateNextEventId(),
      name: parsed.name,
      objective: parsed.objective,
      daysBetweenOccurrences: parsed.daysBetweenOccurrences,
      category: parsed.category,
      classification: parsed.classification,
      status: parsed.status,
      responsible: parsed.responsible,
      occurrences: parsed.occurrences.map((occurrence) => ({
        id: occurrence.id,
        description: occurrence.description,
        startDate: toIsoString(occurrence.startDate),
        endDate: toIsoString(occurrence.endDate),
      })),
      user,
    };

    return calendarData.insertEvent(newEvent);
  }

  async updateEvent(eventId: number, payload: unknown): Promise<IEvent> {
    const schema = await buildEventPayloadSchema();
    const parsed = schema.extend({ id: z.number().int().positive().optional() }).parse(payload);

    if (parsed.id && parsed.id !== eventId) {
      throw new DomainError("CONFLICT", 409, "O id no corpo não coincide com o da rota");
    }

    const existing = await calendarData.findEventById(eventId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    const user = await this.resolveUser(parsed.userId ?? existing.user.id);
    const updatedEvent: IEvent = {
      id: eventId,
      name: parsed.name,
      objective: parsed.objective,
      daysBetweenOccurrences: parsed.daysBetweenOccurrences,
      category: parsed.category,
      classification: parsed.classification,
      status: parsed.status,
      responsible: parsed.responsible,
      occurrences: parsed.occurrences.map((occurrence) => ({
        id: occurrence.id,
        description: occurrence.description,
        startDate: toIsoString(occurrence.startDate),
        endDate: toIsoString(occurrence.endDate),
      })),
      user,
    };

    const saved = await calendarData.replaceEvent(eventId, updatedEvent);
    if (!saved) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    return saved;
  }

  async deleteEvent(eventId: number): Promise<void> {
    const removed = await calendarData.deleteEvent(eventId);
    if (!removed) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }
  }

  async updateOccurrence(
    eventId: number,
    occurrenceId: string,
    payload: unknown,
  ): Promise<IEvent> {
    const parsed = patchOccurrenceSchema.parse(payload);

    if (!parsed.startDate && !parsed.endDate && !parsed.description) {
      throw new DomainError(
        "VALIDATION_ERROR",
        400,
        "Informe pelo menos um campo para atualizar a ocorrência",
      );
    }

    const existing = await calendarData.findEventById(eventId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    const occurrence = existing.occurrences.find((item) => item.id === occurrenceId);
    if (!occurrence) {
      throw new DomainError("NOT_FOUND", 404, "Ocorrência não encontrada");
    }

    const nextOccurrence: IOccurrence = {
      ...occurrence,
      description: parsed.description ?? occurrence.description,
      startDate: toIsoString(parsed.startDate ?? occurrence.startDate),
      endDate: toIsoString(parsed.endDate ?? occurrence.endDate),
    };

    if (new Date(nextOccurrence.endDate) <= new Date(nextOccurrence.startDate)) {
      throw new DomainError(
        "VALIDATION_ERROR",
        400,
        "A data de fim deve ser posterior à data de início",
      );
    }

    const updatedEvent: IEvent = {
      ...existing,
      occurrences: existing.occurrences.map((item) =>
        item.id === occurrenceId ? nextOccurrence : item,
      ),
    };

    const saved = await calendarData.replaceEvent(eventId, updatedEvent);
    if (!saved) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    return saved;
  }

  private async resolveUser(userId?: string): Promise<IUser> {
    const users = await calendarData.listUsers();
    const user = users.find((item) => item.id === userId) ?? users[0];

    if (!user) {
      throw new DomainError(
        "INTERNAL_ERROR",
        500,
        "Nenhum utilizador disponível para associar ao evento",
      );
    }

    return user;
  }

  private async generateNextEventId() {
    const events = await calendarData.listEvents();
    if (events.length === 0) {
      return 1;
    }

    return Math.max(...events.map((event) => event.id)) + 1;
  }
}

export const calendarService = new CalendarService();
