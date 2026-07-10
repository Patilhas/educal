import type { NotificationRecord } from "@/server/notifications/types";

export interface INotificationRepository {
  listAll(): Promise<NotificationRecord[]>;
  insertMany(records: NotificationRecord[]): Promise<void>;
  deleteManyByOccurrenceIds(occurrenceIds: string[]): Promise<void>;
  listReadNotificationIdsForUser(userId: string): Promise<string[]>;
  markRead(notificationId: string, userId: string): Promise<void>;
  markAllRead(notificationIds: string[], userId: string): Promise<void>;
}
