import { calendarData } from "@/server/calendar/data/calendar.data";
import { countWorkingDaysBetween } from "@/server/calendar/rules/utils/working-days";
import { notificationData } from "@/server/notifications/data/notification.data";
import { withRolePolicy, type TRolePolicy } from "@/server/shared/authorize";
import type { IRequestWithAuth } from "@/server/auth/session";
import type { IEvent } from "@/shared/calendar/types";
import type { INotification } from "@/shared/notifications/types";

export class NotificationService {
  async listMine(request: IRequestWithAuth): Promise<INotification[]> {
    const events = await calendarData.listEvents();
    await this.ensureGenerated(events);

    const [records, readIds] = await Promise.all([
      notificationData.listAll(),
      notificationData.listReadNotificationIdsForUser(request.auth.user.id),
    ]);

    const readSet = new Set(readIds);
    const occurrenceIndex = new Map<string, { eventId: number; eventName: string; description: string; startDate: string }>();
    for (const event of events) {
      for (const occurrence of event.occurrences) {
        occurrenceIndex.set(occurrence.id, {
          eventId: event.id,
          eventName: event.name,
          description: occurrence.description,
          startDate: occurrence.startDate,
        });
      }
    }

    return records
      .map((record): INotification | null => {
        const match = occurrenceIndex.get(record.occurrenceId);
        if (!match) return null;

        return {
          id: record.id,
          eventId: match.eventId,
          eventName: match.eventName,
          occurrenceId: record.occurrenceId,
          occurrenceDescription: match.description,
          occurrenceStartDate: match.startDate,
          createdAt: record.createdAt,
          read: readSet.has(record.id),
        };
      })
      .filter((notification): notification is INotification => notification !== null)
      .sort((a, b) => new Date(a.occurrenceStartDate).getTime() - new Date(b.occurrenceStartDate).getTime());
  }

  async markRead(request: IRequestWithAuth, notificationId: string): Promise<void> {
    await notificationData.markRead(notificationId, request.auth.user.id);
  }

  async markAllRead(request: IRequestWithAuth): Promise<void> {
    const [records, readIds] = await Promise.all([
      notificationData.listAll(),
      notificationData.listReadNotificationIdsForUser(request.auth.user.id),
    ]);
    const readSet = new Set(readIds);
    const unreadIds = records.map((record) => record.id).filter((id) => !readSet.has(id));

    if (unreadIds.length > 0) {
      await notificationData.markAllRead(unreadIds, request.auth.user.id);
    }
  }

  private async ensureGenerated(events: IEvent[]): Promise<void> {
    const records = await notificationData.listAll();
    const byOccurrenceId = new Map(records.map((record) => [record.occurrenceId, record]));
    const occurrenceIds = new Set<string>();
    const now = new Date();

    for (const event of events) {
      for (const occurrence of event.occurrences) {
        occurrenceIds.add(occurrence.id);
        const effectiveLeadDays = occurrence.notifyDaysBeforeOverride ?? event.notifyDaysBefore;
        const existing = byOccurrenceId.get(occurrence.id);

        if (
          existing &&
          (existing.occurrenceStartDateAtGen !== occurrence.startDate ||
            existing.leadDaysAtGen !== (effectiveLeadDays ?? null))
        ) {
          await notificationData.deleteByOccurrenceId(occurrence.id);
          byOccurrenceId.delete(occurrence.id);
        }

        const occurrenceStartDate = new Date(occurrence.startDate);
        const alreadyGenerated = byOccurrenceId.has(occurrence.id);

        if (
          typeof effectiveLeadDays === "number" &&
          !alreadyGenerated &&
          occurrenceStartDate > now &&
          countWorkingDaysBetween(now, occurrenceStartDate) <= effectiveLeadDays
        ) {
          await notificationData.insert({
            id: crypto.randomUUID(),
            occurrenceId: occurrence.id,
            occurrenceStartDateAtGen: occurrence.startDate,
            leadDaysAtGen: effectiveLeadDays,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    for (const record of records) {
      if (!occurrenceIds.has(record.occurrenceId)) {
        await notificationData.deleteByOccurrenceId(record.occurrenceId);
      }
    }
  }
}

const notificationServiceInstance = new NotificationService();

export const notificationService = withRolePolicy(
  notificationServiceInstance,
  {
    listMine: "any",
    markRead: "any",
    markAllRead: "any",
  } satisfies Partial<Record<keyof NotificationService, TRolePolicy>>,
  (args) => (args[0] as IRequestWithAuth).auth.user.role,
);
