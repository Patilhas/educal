export interface NotificationRecord {
  id: string;
  occurrenceId: string;
  occurrenceStartDateAtGen: string;
  leadDaysAtGen: number | null;
  createdAt: string;
}

export interface NotificationReadRecord {
  notificationId: string;
  userId: string;
  readAt: string;
}

export interface NotificationDb {
  notifications: NotificationRecord[];
  reads: NotificationReadRecord[];
}
