import type { INotification } from "@/shared/notifications/types";
import { requestJson } from "@/lib/api-client";

export const fetchNotificationsRequest = async (): Promise<INotification[]> => {
  return requestJson<INotification[]>("/api/notifications");
};

export const markNotificationReadRequest = async (notificationId: string) => {
  return requestJson<{ read: boolean }>(`/api/notifications/${notificationId}/read`, {
    method: "POST",
  });
};

export const markAllNotificationsReadRequest = async () => {
  return requestJson<{ read: boolean }>("/api/notifications/read-all", {
    method: "POST",
  });
};
