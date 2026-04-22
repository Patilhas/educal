import { cva } from "class-variance-authority";
import { differenceInMinutes, parseISO } from "date-fns";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import EventDetailsDialog from "@/features/calendar/dialogs/event-details-dialog";
import { DraggableEvent } from "@/features/calendar/dnd/draggable-event";
import { ResizableEvent } from "@/features/calendar/dnd/resizable-event";
import {
  formatTime,
  getWeekDotFillClass,
  getWeekEventColorClass,
} from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";

const calendarWeekEventCardVariants = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-2 py-1.5 text-xs focus-visible:outline-offset-2",
);

interface IProps
  extends
  HTMLAttributes<HTMLDivElement> {
  event: IEvent;
  occurrence: IOccurrence;
}

export function EventBlock({ event, occurrence, className }: IProps) {
  const { badgeVariant, use24HourFormat, getEventColor } = useCalendar();

  const start = parseISO(occurrence.startDate);
  const end = parseISO(occurrence.endDate);
  const durationInMinutes = differenceInMinutes(end, start);
  const heightInPixels = (durationInMinutes / 60) * 96 - 8;
  const eventColor = getEventColor(event.category);

  const calendarWeekEventCardClasses = cn(
    calendarWeekEventCardVariants(),
    getWeekEventColorClass(eventColor, badgeVariant),
    durationInMinutes < 35 && "py-0 justify-center",
    className,
  );

  return (
    <ResizableEvent event={event} occurrence={occurrence}>
      <DraggableEvent event={event} occurrence={occurrence}>
        <EventDetailsDialog event={event} occurrence={occurrence}>
          <button
            type="button"
            className={calendarWeekEventCardClasses}
            style={{ height: `${heightInPixels}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {badgeVariant === "dot" && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  xmlns="http://www.w3.org/2000/svg"
                  className={cn("shrink-0", getWeekDotFillClass(eventColor))}
                  aria-hidden="true"
                >
                  <circle cx="4" cy="4" r="4" />
                </svg>
              )}

              <p className="truncate font-semibold">{event.name}</p>
            </div>

            {durationInMinutes > 25 && (
              <p>
                {formatTime(start, use24HourFormat)} -{" "}
                {formatTime(end, use24HourFormat)}
              </p>
            )}
          </button>
        </EventDetailsDialog>
      </DraggableEvent>
    </ResizableEvent>
  );
}
