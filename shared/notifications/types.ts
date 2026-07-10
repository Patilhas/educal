export interface INotification {
  id: string;
  eventId: number;
  eventName: string;
  occurrenceId: string;
  occurrenceDescription: string;
  occurrenceStartDate: string;
  createdAt: string;
  read: boolean;
}
