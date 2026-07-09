import { Redis } from "@upstash/redis";
import { NOTIFICATION_REDIS_DB_KEY } from "@/server/shared/config";
import type { INotificationRepository } from "@/server/notifications/data/notification.repository";
import type { NotificationDb, NotificationRecord } from "@/server/notifications/types";

const clone = <T>(value: T): T => structuredClone(value);
const CACHE_REVALIDATE_MS = 500;
const EMPTY_DB: NotificationDb = { notifications: [], reads: [] };

export class NotificationRepositoryRedis implements INotificationRepository {
  private writeQueue: Promise<void> = Promise.resolve();
  private cachedDb: NotificationDb | null = null;
  private lastCacheValidationAt = 0;
  private redis = Redis.fromEnv();

  private async readDb(): Promise<NotificationDb> {
    await this.writeQueue;

    const now = Date.now();
    if (this.cachedDb && now - this.lastCacheValidationAt < CACHE_REVALIDATE_MS) {
      return this.cachedDb;
    }

    const raw = (await this.redis.get(NOTIFICATION_REDIS_DB_KEY)) as NotificationDb | null;
    const db = raw ?? clone(EMPTY_DB);
    this.cachedDb = db;
    this.lastCacheValidationAt = now;

    return db;
  }

  private async persistDb(mutate: (db: NotificationDb) => NotificationDb): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const raw = (await this.redis.get(NOTIFICATION_REDIS_DB_KEY)) as NotificationDb | null;
      const db = raw ?? clone(EMPTY_DB);
      const nextDb = mutate(db);
      await this.redis.set(NOTIFICATION_REDIS_DB_KEY, JSON.stringify(nextDb));
      this.cachedDb = clone(nextDb);
      this.lastCacheValidationAt = Date.now();
    });
    await this.writeQueue;
  }

  async listAll(): Promise<NotificationRecord[]> {
    const db = await this.readDb();
    return clone(db.notifications);
  }

  async insert(record: NotificationRecord): Promise<void> {
    await this.persistDb((db) => {
      if (db.notifications.some((n) => n.occurrenceId === record.occurrenceId)) {
        return db;
      }
      return { ...db, notifications: [...db.notifications, record] };
    });
  }

  async deleteByOccurrenceId(occurrenceId: string): Promise<void> {
    await this.persistDb((db) => {
      const toDelete = db.notifications.filter((n) => n.occurrenceId === occurrenceId);
      if (toDelete.length === 0) return db;
      const deletedIds = new Set(toDelete.map((n) => n.id));
      return {
        notifications: db.notifications.filter((n) => n.occurrenceId !== occurrenceId),
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
