"use client"

import { format } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { CheckCheck } from "lucide-react";

export default function NotificationsPopover() {
  const { notifications, events, markNotificationRead, setSelectedDate } = useCalendar();

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    await markNotificationRead("ALL");
  };

  const handleNotificationClick = (dateString?: string) => {
    if (dateString) {
      setSelectedDate(new Date(dateString));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} collisionPadding={16} className="w-[min(24rem,calc(100vw-1rem))] p-0">
        <div className="max-h-[min(24rem,calc(100vh-8rem))] overflow-hidden rounded-lg">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Notificações</h3>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-1 h-3 w-3" />
                Marcar todas lidas
              </Button>
            )}
          </div>

          <div className="p-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem notificações pendentes</p>
            ) : (
              <ScrollArea className="max-h-72 pr-1">
                <div className="space-y-2">
                  {notifications.map((n) => {
                    const event = events.find((e) => e.id === n.eventId);
                    const occ = event?.occurrences.find((o) => o.id === n.occurrenceId);
                    return (
                      <div
                        key={n.id}
                        className="rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleNotificationClick(occ?.startDate)}
                      >
                        <p className="text-sm font-bold text-primary wrap-break-word">{event?.name ?? "Evento"}</p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {occ ? format(new Date(occ.startDate), "dd/MM/yyyy HH:mm") : "—"}
                        </p>
                        <p className="mt-1 wrap-break-word text-xs text-muted-foreground line-clamp-2">
                          {event?.objective ?? "Sem detalhes"}
                        </p>
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" variant="outline" onClick={(e) => handleMarkRead(n.id, e)}>
                            Marcar como lida
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


