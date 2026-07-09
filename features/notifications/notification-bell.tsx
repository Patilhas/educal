"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/i18n/use-translations";
import {
  fetchNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "@/features/notifications/client-requests";
import type { INotification } from "@/shared/notifications/types";

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const { t } = useTranslations();
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotificationsRequest();
      setNotifications(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("notifications.errors.loadFailed");
      toast.error(message);
    }
  }, [t]);

  useEffect(() => {
    // Fetching notifications from the API on mount and on a poll interval is an
    // intentional synchronization with an external system, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const visibleNotifications = notifications.filter((notification) => !notification.read);
  const unreadCount = visibleNotifications.length;

  const handleMarkRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationReadRequest(notificationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("notifications.errors.markReadFailed");
      toast.error(message);
      loadNotifications();
    }
  };

  const handleNotificationClick = (notification: INotification) => {
    handleMarkRead(notification.id);
    setIsOpen(false);
    router.push(`/?openEventId=${notification.eventId}&openOccurrenceId=${notification.occurrenceId}`);
  };

  const handleMarkAllRead = async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsReadRequest();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("notifications.errors.markAllReadFailed");
      toast.error(message);
      loadNotifications();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title={t("notifications.bell.title")}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3">
          <span className="font-medium">{t("notifications.bell.title")}</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              {t("notifications.bell.markAllRead")}
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {visibleNotifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("notifications.bell.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-1 p-1">
              {visibleNotifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full rounded-md bg-muted/50 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <p>{notification.eventName}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.occurrenceDescription} —{" "}
                      {new Date(notification.occurrenceStartDate).toLocaleDateString("pt-PT")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
