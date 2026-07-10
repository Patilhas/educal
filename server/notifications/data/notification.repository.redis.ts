import { NOTIFICATION_REDIS_DB_KEY } from "@/server/shared/config";
import type { INotificationRepository } from "@/server/notifications/data/notification.repository";
import type { NotificationDb, NotificationRecord } from "@/server/notifications/types";
import { RedisDbStore, clone } from "@/server/shared/data/redis-store";

const EMPTY_DB: NotificationDb = { notifications: [], reads: [] };

export class NotificationRepositoryRedis extends RedisDbStore<NotificationDb> implements INotificationRepository {
  constructor() {
    super(NOTIFICATION_REDIS_DB_KEY, (raw) => raw ?? clone(EMPTY_DB));
  }

  async listAll(): Promise<NotificationRecord[]> {
    const db = await this.readDb();
    return clone(db.notifications);
  }

  async insertMany(records: NotificationRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.persistDb((db) => {
      const existingOccurrenceIds = new Set(db.notifications.map((n) => n.occurrenceId));
      const toAdd = records.filter((record) => !existingOccurrenceIds.has(record.occurrenceId));
      if (toAdd.length === 0) return db;
      return { ...db, notifications: [...db.notifications, ...toAdd] };
    });
  }

  async deleteManyByOccurrenceIds(occurrenceIds: string[]): Promise<void> {
    if (occurrenceIds.length === 0) return;
    await this.persistDb((db) => {
      const idSet = new Set(occurrenceIds);
      const toDelete = db.notifications.filter((n) => idSet.has(n.occurrenceId));
      if (toDelete.length === 0) return db;
      const deletedIds = new Set(toDelete.map((n) => n.id));
      return {
        notifications: db.notifications.filter((n) => !idSet.has(n.occurrenceId)),
        reads: db.reads.filter((r) => !deletedIds.has(r.notificationId)),
      };
    });
  }

  async listReadNotificationIdsForUser(userId: string): Promise<string[]> {
    const db = await this.readDb();
    return db.reads.filter((r) => r.userId === userId).map((r) => r.notificationId);
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.persistDb((db) => {
      if (db.reads.some((r) => r.notificationId === notificationId && r.userId === userId)) {
        return db;
      }
      return {
        ...db,
        reads: [...db.reads, { notificationId, userId, readAt: new Date().toISOString() }],
      };
    });
  }

  async markAllRead(notificationIds: string[], userId: string): Promise<void> {
    if (notificationIds.length === 0) return;
    await this.persistDb((db) => {
      const alreadyRead = new Set(
        db.reads.filter((r) => r.userId === userId).map((r) => r.notificationId),
      );
      const newReads = notificationIds
        .filter((id) => !alreadyRead.has(id))
        .map((notificationId) => ({ notificationId, userId, readAt: new Date().toISOString() }));
      if (newReads.length === 0) return db;
      return { ...db, reads: [...db.reads, ...newReads] };
    });
  }
}
