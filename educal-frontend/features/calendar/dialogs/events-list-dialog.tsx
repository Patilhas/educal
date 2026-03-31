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
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { dayCellVariants } from "@/features/calendar/views/month-view/day-cell";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";
import { EventDetailsDialog } from "@/features/calendar/dialogs/event-details-dialog";

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
  const { badgeVariant, use24HourFormat } = useCalendar();

  const defaultTrigger = (
    <span className="cursor-pointer">
      <span className="sm:hidden">+{hiddenOccurrencesCount}</span>
      <span className="hidden sm:inline py-0.5 px-2 my-1 rounded-xl border">
        {hiddenOccurrencesCount}
        <span className="mx-1">mais...</span>
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
              <EventBullet color={cellOccurrences[0]?.event.color} className="" />
              <p className="text-sm font-medium">
                Events on {format(date, "EEEE, MMMM d, yyyy")}
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
                      [dayCellVariants({ color: occurrence.event.color })]:
                        badgeVariant === "colored",
                    },
                  )}
                >
                  <EventBullet color={occurrence.event.color} />
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
              Nenhum evento para esta data.
            </p>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
