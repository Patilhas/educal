import { format } from "date-fns";
import type { ReactNode } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/responsive-modal";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import {
  formatTime,
  getColorClass,
} from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";
import EventDetailsDialog from "@/features/calendar/dialogs/event-details-dialog";
import { useTranslations } from "@/i18n/use-translations";

interface EventListDialogProps {
  date: Date;
  occurrences: { event: IEvent; occurrence: IOccurrence }[];
  maxVisibleEvents?: number;
  children?: ReactNode;
}

export function EventListDialog({
  date,
  occurrences,
  maxVisibleEvents = 3,
  children,
}: EventListDialogProps) {
  const cellOccurrences = occurrences;
  const hiddenOccurrencesCount = Math.max(cellOccurrences.length - maxVisibleEvents, 0);
  const { badgeVariant, use24HourFormat, getEventColor } = useCalendar();
  const { t } = useTranslations();

  const defaultTrigger = (
    <span className="cursor-pointer">
      <span className="sm:hidden">
        {t("calendar.views.eventsList.moreShort", { count: hiddenOccurrencesCount })}
      </span>
      <span className="hidden sm:inline py-0.5 px-2 my-1 rounded-xl border">
        {t("calendar.views.eventsList.more", { count: hiddenOccurrencesCount })}
      </span>
    </span>
  );

  return (
    <Modal>
      <ModalTrigger asChild>{children || defaultTrigger}</ModalTrigger>
      <ModalContent className="sm:max-w-[425px]">
        <ModalHeader>
          <ModalTitle className="my-2">
            <div className="flex items-center gap-2">
              <EventBullet
                color={
                  cellOccurrences[0]
                    ? getEventColor(cellOccurrences[0].event.category)
                    : "blue"
                }
                className=""
              />
              <p className="text-sm font-medium">
                {t("calendar.views.month.eventsOn")} {format(date, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </ModalTitle>
        </ModalHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {cellOccurrences.length > 0 ? (
            cellOccurrences.map((occurrence) => (
              <EventDetailsDialog event={occurrence.event} occurrence={occurrence.occurrence} key={occurrence.occurrence.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 border rounded-md hover:bg-muted cursor-pointer",
                    {
                      [getColorClass(getEventColor(occurrence.event.category))]:
                        badgeVariant === "colored",
                    },
                  )}
                >
                  <EventBullet color={getEventColor(occurrence.event.category)} />
                  <div className="flex justify-between items-center w-full">
                    <p className="text-sm font-medium">{occurrence.event.name}</p>
                    <p className="text-xs">
                      {formatTime(occurrence.occurrence.startDate, use24HourFormat)}
                    </p>
                  </div>
                </div>
              </EventDetailsDialog>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("calendar.dialogs.eventsList.noEvents")}
            </p>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
