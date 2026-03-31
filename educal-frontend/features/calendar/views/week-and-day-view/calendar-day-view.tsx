import { format, isWithinInterval, parseISO } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { DayPicker } from "@/components/ui/day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";

import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { DroppableArea } from "@/features/calendar/dnd/droppable-area";
import { groupOccurrences } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { CalendarTimeline } from "@/features/calendar/views/week-and-day-view/calendar-time-line";
import { DayViewMultiDayEventsRow } from "@/features/calendar/views/week-and-day-view/day-view-multi-day-events-row";
import { RenderGroupedEvents } from "@/features/calendar/views/week-and-day-view/render-grouped-events";

interface IProps {
  singleDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
  multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export function CalendarDayView({ singleDayOccurrences, multiDayOccurrences }: IProps) {
  const { selectedDate, setSelectedDate, users, use24HourFormat } =
    useCalendar();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (!scrollAreaRef.current) return;

      const scrollArea = scrollAreaRef.current;
      const rect = scrollArea.getBoundingClientRect();
      const scrollSpeed = 15;

      const scrollContainer =
        scrollArea.querySelector("[data-radix-scroll-area-viewport]") ||
        scrollArea;

      if (e.clientY < rect.top + 60) {
        scrollContainer.scrollTop -= scrollSpeed;
      }

      if (e.clientY > rect.bottom - 60) {
        scrollContainer.scrollTop += scrollSpeed;
      }
    };

    document.addEventListener("dragover", handleDragOver);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
    };
  }, []);

  const getCurrentOccurrences = (occurrences: { event: IEvent; occurrence: IOccurrence }[]) => {
    const now = new Date();

    return (
      occurrences.filter(({ occurrence }) =>
        isWithinInterval(now, {
          start: parseISO(occurrence.startDate),
          end: parseISO(occurrence.endDate),
        }),
      ) || []
    );
  };

  const currentOccurrences = getCurrentOccurrences(singleDayOccurrences);

  const dayOccurrences = singleDayOccurrences.filter(({ occurrence }) => {
    const occurrenceDate = parseISO(occurrence.startDate);
    return (
      occurrenceDate.getDate() === selectedDate.getDate() &&
      occurrenceDate.getMonth() === selectedDate.getMonth() &&
      occurrenceDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const groupedOccurrences = groupOccurrences(dayOccurrences);

  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        <div>
          <DayViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayOccurrences={multiDayOccurrences}
          />

          {/* Day header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18"></div>
            <span className="flex-1 border-l py-2 text-center text-xs font-medium text-t-quaternary">
              {format(selectedDate, "EE")}{" "}
              <span className="font-semibold text-t-secondary">
                {format(selectedDate, "d")}
              </span>
            </span>
          </div>
        </div>

        <ScrollArea className="h-[800px]" type="always" ref={scrollAreaRef}>
          <div className="flex">
            {/* Hours column */}
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: "96px" }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-t-quaternary">
                        {format(
                          new Date().setHours(hour, 0, 0, 0),
                          use24HourFormat ? "HH:00" : "h a",
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="relative flex-1 border-l">
              <div className="relative">
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className="relative"
                    style={{ height: "96px" }}
                  >
                    {index !== 0 && (
                      <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>
                    )}

                    <DroppableArea
                      date={selectedDate}
                      hour={hour}
                      minute={0}
                      className="absolute inset-x-0 top-0 h-[48px]"
                    >
                      <AddEditEventDialog
                        startDate={selectedDate}
                        startTime={{ hour, minute: 0 }}
                      >
                        <div className="absolute inset-0 cursor-pointer transition-colors hover:bg-secondary" />
                      </AddEditEventDialog>
                    </DroppableArea>

                    <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-b-tertiary"></div>

                    <DroppableArea
                      date={selectedDate}
                      hour={hour}
                      minute={30}
                      className="absolute inset-x-0 bottom-0 h-[48px]"
                    >
                      <AddEditEventDialog
                        startDate={selectedDate}
                        startTime={{ hour, minute: 30 }}
                      >
                        <div className="absolute inset-0 cursor-pointer transition-colors hover:bg-secondary" />
                      </AddEditEventDialog>
                    </DroppableArea>
                  </div>
                ))}

                <RenderGroupedEvents
                  groupedOccurrences={groupedOccurrences}
                  day={selectedDate}
                />
              </div>

              <CalendarTimeline />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="hidden w-72 divide-y border-l md:block">
        <DayPicker
          className="mx-auto w-fit"
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          initialFocus
        />

        <div className="flex-1 space-y-3">
          {currentOccurrences.length > 0 ? (
            <div className="flex items-start gap-2 px-4 pt-4">
              <span className="relative mt-[5px] flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-green-600"></span>
              </span>

              <p className="text-sm font-semibold text-t-secondary">
                A acontecer
              </p>
            </div>
          ) : (
            <p className="p-4 text-center text-sm italic text-t-tertiary">
              Nenhum evento a acontecer no momento
            </p>
          )}

          {currentOccurrences.length > 0 && (
            <ScrollArea className="h-[422px] px-4" type="always">
              <div className="space-y-6 pb-4">
                {currentOccurrences.map(({ event, occurrence }) => {
                  const user = users.find((user) => user.id === event.user.id);

                  return (
                    <div key={occurrence.id} className="space-y-1.5">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {event.name}
                      </p>

                      {user && (
                        <div className="flex items-center gap-1.5">
                          <User className="size-4 text-t-quinary" />
                          <span className="text-sm text-t-tertiary">
                            {user.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-4 text-t-quinary" />
                        <span className="text-sm text-t-tertiary">
                          {format(new Date(occurrence.startDate), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4 text-t-quinary" />
                        <span className="text-sm text-t-tertiary">
                          {format(
                            parseISO(occurrence.startDate),
                            use24HourFormat ? "HH:mm" : "hh:mm a",
                          )}{" "}
                          -
                          {format(
                            parseISO(occurrence.endDate),
                            use24HourFormat ? "HH:mm" : "hh:mm a",
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
