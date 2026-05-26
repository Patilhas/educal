import { z } from "zod";
import { canManageCalendarEvents } from "@/shared/user/roles";
import type { IEvent, IOccurrence, INotification } from "@/shared/calendar/types";
import type { IUser } from "@/shared/user/types";
import {
  buildEventPayloadSchema,
  patchOccurrenceSchema,
} from "@/server/calendar/schemas";
import { calendarData } from "@/server/calendar/data/calendar.data";
import { authService } from "@/server/auth/services/auth.service";
import type { IRequestWithAuth } from "@/server/auth/session";
import { DomainError } from "@/server/shared/domain-error";

const toIsoString = (dateValue: string) => new Date(dateValue).toISOString();
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

const getAlertOffsetMs = (value: number, unit: string) => {
  if (unit === "minutes") return value * MINUTE_MS;
  if (unit === "hours") return value * HOUR_MS;
  if (unit === "weeks") return value * WEEK_MS;
  return value * DAY_MS; // default days
};

export class CalendarService {
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

  async createEvent(request: IRequestWithAuth, payload: unknown): Promise<IEvent> {
    this.ensureCanManageEvents(request.auth.user.role);
    const schema = await buildEventPayloadSchema();
    const parsed = schema.parse(payload);

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
        alerts: occurrence.alerts || [],
      })),
      user: request.auth.user,
      emailTemplate: parsed.emailTemplate ?? null,
    };

    const saved = await calendarData.insertEvent(newEvent);
    await this.syncEventNotifications(saved, saved.id);

    return saved;
  }

  async updateEvent(request: IRequestWithAuth, eventId: number, payload: unknown): Promise<IEvent> {
    this.ensureCanManageEvents(request.auth.user.role);
    const schema = await buildEventPayloadSchema();
    const parsed = schema.extend({ id: z.number().int().positive().optional() }).parse(payload);

    if (parsed.id && parsed.id !== eventId) {
      throw new DomainError("CONFLICT", 409, "O id no corpo não coincide com o da rota");
    }

    const existing = await calendarData.findEventById(eventId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

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
        alerts: occurrence.alerts || [],
      })),
      user: existing.user,
      emailTemplate: parsed.emailTemplate ?? existing.emailTemplate ?? null,
    };

    const saved = await calendarData.replaceEvent(eventId, updatedEvent);
    if (!saved) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    await this.syncEventNotifications(saved, saved.id);

    return saved;
  }

  async deleteEvent(request: IRequestWithAuth, eventId: number): Promise<void> {
    this.ensureCanManageEvents(request.auth.user.role);
    const removed = await calendarData.deleteEvent(eventId);
    if (!removed) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    await this.syncEventNotifications(null, eventId);
  }

  async listNotifications(userId: string): Promise<INotification[]> {
    const notifications = await calendarData.listNotifications();
    const now = Date.now();
    return notifications.filter(
      (n) => n.unreadIds.includes(userId) && new Date(n.triggeredAt).getTime() <= now
    );
  }

  private async syncEventNotifications(event: IEvent | null, eventId: number) {
    const notifications = await calendarData.listNotifications();
    const existingForEvent = notifications.filter((n) => n.eventId === eventId);

    if (!event) {
      const idsToDelete = existingForEvent.map((n) => n.id);
      if (idsToDelete.length > 0) {
        await calendarData.deleteNotifications(idsToDelete);
      }
      return;
    }

    const existingMap = new Map(existingForEvent.map((n) => [n.id, n]));
    const toInsert: INotification[] = [];
    const validAndUnchangedIds = new Set<string>();
    const now = Date.now();

    const calendarUsers = await authService.listCalendarUsers();
    const allUserIds = calendarUsers.map(u => u.id);

    event.occurrences.forEach((occ) => {
      const occurrenceStart = new Date(occ.startDate).getTime();
      const alerts = occ.alerts || [];

      alerts.forEach((alert) => {
        const offsetMs = getAlertOffsetMs(alert.value, alert.unit);
        const triggerAt = occurrenceStart - offsetMs;
        const triggerAtIso = new Date(triggerAt).toISOString();
        const id = `${event.id}::${occ.id}::${alert.id}`;

        const existing = existingMap.get(id);

        if (existing && existing.triggeredAt === triggerAtIso) {
          validAndUnchangedIds.add(id);
        } else {
          if (triggerAt > now) {
            toInsert.push({
              id,
              eventId: event.id,
              occurrenceId: occ.id,
              unreadIds: allUserIds,
              triggeredAt: triggerAtIso,
            });
          }
        }
      });
    });

    const idsToDelete = existingForEvent
      .filter((n) => !validAndUnchangedIds.has(n.id))
      .map((n) => n.id);

    if (idsToDelete.length > 0) {
      await calendarData.deleteNotifications(idsToDelete);
    }

    if (toInsert.length > 0) {
      await calendarData.insertNotifications(toInsert);
    }
  }

  async markNotificationRead(request: IRequestWithAuth, notificationId: string) {
    const userId = request.auth.user.id;
    const notifications = await calendarData.listNotifications();

    if (notificationId === "ALL") {
      const notificationsToUpdate = notifications.filter((n) => n.unreadIds.includes(userId));

      const toUpdate: INotification[] = [];
      const idsToDelete: string[] = [];

      for (const n of notificationsToUpdate) {
        const nextUnread = n.unreadIds.filter(id => id !== userId);
        if (nextUnread.length === 0) {
          idsToDelete.push(n.id);
        } else {
          toUpdate.push({ ...n, unreadIds: nextUnread });
        }
      }

      const allIdsToModify = [...idsToDelete, ...toUpdate.map(n => n.id)];
      if (allIdsToModify.length > 0) {
        await calendarData.deleteNotifications(allIdsToModify);
      }

      if (toUpdate.length > 0) {
        await calendarData.insertNotifications(toUpdate);
      }
    } else {
      const notification = notifications.find((n) => n.id === notificationId);

      if (!notification || !notification.unreadIds.includes(userId)) {
        throw new DomainError("NOT_FOUND", 404, "Notificação não encontrada");
      }

      const nextUnread = notification.unreadIds.filter(id => id !== userId);
      await calendarData.deleteNotifications([notificationId]);

      if (nextUnread.length > 0) {
        await calendarData.insertNotifications([{ ...notification, unreadIds: nextUnread }]);
      }
    }
  }

  async updateOccurrence(
    request: IRequestWithAuth,
    eventId: number,
    occurrenceId: string,
    payload: unknown,
  ): Promise<IEvent> {
    this.ensureCanManageEvents(request.auth.user.role);
    const parsed = patchOccurrenceSchema.parse(payload);

    if (
      parsed.startDate === undefined &&
      parsed.endDate === undefined &&
      parsed.description === undefined &&
      parsed.alerts === undefined
    ) {
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
      alerts: parsed.alerts !== undefined ? parsed.alerts : (occurrence.alerts || []),
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

    await this.syncEventNotifications(saved, saved.id);

    return saved;
  }

  private async generateNextEventId() {
    const events = await calendarData.listEvents();
    if (events.length === 0) {
      return 1;
    }

    return Math.max(...events.map((event) => event.id)) + 1;
  }

  private ensureCanManageEvents(role: IUser["role"]) {
    if (!canManageCalendarEvents(role)) {
      throw new DomainError(
        "FORBIDDEN",
        403,
        "É necessário ter pelo menos o role editor para alterar eventos",
      );
    }
  }
}

export const calendarService = new CalendarService();
