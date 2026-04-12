import { cva } from "class-variance-authority";
import { endOfDay, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import EventDetailsDialog from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import {
  formatTime,
  getEventColorByCategory,
  getMonthEventColorClass,
} from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";

const eventBadgeVariants = cva(
  "flex w-full h-6.5 select-none items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs cursor-grab",
  {
    variants: {
      multiDayPosition: {
        first: "relative z-10 mr-0 rounded-r-none border-r-0 [&>span]:mr-2.5",
        middle:
          "relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0",
        last: "ml-0 rounded-l-none border-l-0",
        none: "",
      },
    },
  },
);

interface IProps {
  event: IEvent;
  occurrence: IOccurrence;
  cellDate: Date;
  occurrenceCurrentDay?: number;
  occurrenceTotalDays?: number;
  className?: string;
  position?: "first" | "middle" | "last" | "none";
}

export function MonthEventBadge({
  event,
  occurrence,
  cellDate,
  occurrenceCurrentDay,
  occurrenceTotalDays,
  className,
  position: propPosition,
}: IProps) {
  const { badgeVariant, use24HourFormat } = useCalendar();

  const occurrenceStart = startOfDay(parseISO(occurrence.startDate));
  const occurrenceEnd = endOfDay(parseISO(occurrence.endDate));

  if (cellDate < occurrenceStart || cellDate > occurrenceEnd) return null;

  let position: "first" | "middle" | "last" | "none" | undefined;

  if (propPosition) {
    position = propPosition;
  } else if (occurrenceCurrentDay && occurrenceTotalDays) {
    position = "none";
  } else if (isSameDay(occurrenceStart, occurrenceEnd)) {
    position = "none";
  } else if (isSameDay(cellDate, occurrenceStart)) {
    position = "first";
  } else if (isSameDay(cellDate, occurrenceEnd)) {
    position = "last";
  } else {
    position = "middle";
  }

  const renderBadgeText = ["first", "none"].includes(position);
  const renderBadgeTime = ["last", "none"].includes(position);
  const eventColor = getEventColorByCategory(event.category);

  const eventBadgeClasses = cn(
    eventBadgeVariants({ multiDayPosition: position }),
    getMonthEventColorClass(eventColor, badgeVariant),
    className,
  );

  const marginClass = {
    first: "ml-1 mr-0",
    middle: "mx-0",
    last: "ml-0 mr-1",
    none: "mx-1",
  }[position || "none"];

  return (
    <DraggableEvent event={event} occurrence={occurrence} className={marginClass}>
      <EventDetailsDialog event={event} occurrence={occurrence}>
        <button type="button" className={eventBadgeClasses}>
          <div className="flex items-center gap-1.5 truncate">
            {!["middle", "last"].includes(position) &&
              badgeVariant === "dot" && <EventBullet color={eventColor} />}

            {renderBadgeText && (
              <p className="flex-1 truncate font-semibold">
                {occurrenceCurrentDay && (
                  <span className="text-xs">
                    Dia {occurrenceCurrentDay} de {occurrenceTotalDays} •{" "}
                  </span>
                )}
                {event.name}
              </p>
            )}
          </div>

          <div className="hidden sm:block">
            {renderBadgeTime && (
              <span>
                {formatTime(new Date(occurrence.startDate), use24HourFormat)}
              </span>
            )}
          </div>
        </button>
      </EventDetailsDialog>
    </DraggableEvent>
  );
}

