import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, notificationReads } from "@/db/schema/notification.schema";
import type { INotificationRepository } from "@/server/notifications/data/notification.repository";
import type { NotificationRecord } from "@/server/notifications/types";

function toDomainRecord(row: typeof notifications.$inferSelect): NotificationRecord {
  return {
    id: row.id,
    occurrenceId: row.occurrenceId,
    occurrenceStartDateAtGen: row.occurrenceStartDateAtGen.toISOString(),
    leadDaysAtGen: row.leadDaysAtGen,
    createdAt: row.createdAt.toISOString(),
  };
}

export class NotificationRepositoryPostgres implements INotificationRepository {
  async listAll(): Promise<NotificationRecord[]> {
    const rows = await db.select().from(notifications);
    return rows.map(toDomainRecord);
  }

  async insertMany(records: NotificationRecord[]): Promise<void> {
    if (records.length === 0) return;
    await db
      .insert(notifications)
      .values(
        records.map((record) => ({
          id: record.id,
          occurrenceId: record.occurrenceId,
          occurrenceStartDateAtGen: new Date(record.occurrenceStartDateAtGen),
          leadDaysAtGen: record.leadDaysAtGen,
          createdAt: new Date(record.createdAt),
        })),
      )
      .onConflictDoNothing({ target: notifications.occurrenceId });
  }

  async deleteManyByOccurrenceIds(occurrenceIds: string[]): Promise<void> {
    if (occurrenceIds.length === 0) return;
    await db.delete(notifications).where(inArray(notifications.occurrenceId, occurrenceIds));
  }

  async listReadNotificationIdsForUser(userId: string): Promise<string[]> {
    const rows = await db
      .select({ notificationId: notificationReads.notificationId })
      .from(notificationReads)
      .where(eq(notificationReads.userId, userId));
    return rows.map((row) => row.notificationId);
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await db
      .insert(notificationReads)
      .values({ notificationId, userId, readAt: new Date() })
      .onConflictDoNothing();
  }

  async markAllRead(notificationIds: string[], userId: string): Promise<void> {
    if (notificationIds.length === 0) return;
    await db
      .insert(notificationReads)
      .values(notificationIds.map((notificationId) => ({ notificationId, userId, readAt: new Date() })))
      .onConflictDoNothing();
  }
}
