import { format, isWithinInterval, parseISO } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { DayPicker } from "@/components/ui/day-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useTranslations } from "@/i18n/use-translations";

import { groupOccurrences } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { CalendarTimeline } from "@/features/calendar/views/week-and-day-view/calendar-time-line";
import { DayViewMultiDayEventsRow } from "@/features/calendar/views/week-and-day-view/day-view-multi-day-events-row";
import { RenderGroupedEvents } from "@/features/calendar/views/week-and-day-view/render-grouped-events";
import { TimeGridDaySlots } from "@/features/calendar/views/week-and-day-view/time-grid-day-slots";
import { TimeGridHoursColumn } from "@/features/calendar/views/week-and-day-view/time-grid-hours-column";

interface IProps {
  singleDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
  multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export default function CalendarDayView({ singleDayOccurrences, multiDayOccurrences }: IProps) {
  const { selectedDate, setSelectedDate, users, use24HourFormat } =
    useCalendar();
  const { t } = useTranslations();
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
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <DayViewMultiDayEventsRow
            selectedDate={selectedDate}
            multiDayOccurrences={multiDayOccurrences}
          />

          {/* Day header */}
          <div className="relative z-20 flex border-b">
            <div className="w-18"></div>
            <span className="flex-1 border-l py-2 text-center text-xs font-medium text-muted-foreground/70">
              {format(selectedDate, "EE")}{" "}
              <span className="font-semibold text-foreground">
                {format(selectedDate, "d")}
              </span>
            </span>
          </div>
        </div>

        <ScrollArea className="h-full min-h-0 flex-1" type="always" ref={scrollAreaRef}>
          <div className="flex">
            {/* Hours column */}
            <TimeGridHoursColumn
              hours={hours}
              use24HourFormat={use24HourFormat}
            />

            {/* Day grid */}
            <div className="relative flex-1 border-l">
              <div className="relative">
                <TimeGridDaySlots day={selectedDate} hours={hours} />

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

      <div className="hidden min-h-0 w-72 divide-y border-l md:flex md:flex-col">
        <DayPicker
          className="mx-auto w-fit"
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
        />

        <div className="flex min-h-0 flex-1 flex-col space-y-3">
          {currentOccurrences.length > 0 ? (
            <div className="flex items-start gap-2 px-4 pt-4">
              <span className="relative mt-1.25 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-2.5 rounded-full bg-green-600"></span>
              </span>

              <p className="text-sm font-semibold text-foreground">
                {t("calendar.views.day.happeningNow")}
              </p>
            </div>
          ) : (
            <p className="p-4 text-center text-sm italic text-muted-foreground">
              {t("calendar.views.day.noEventsNow")}
            </p>
          )}

          {currentOccurrences.length > 0 && (
            <ScrollArea className="min-h-0 flex-1 px-4" type="always">
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
                          <User className="size-4 text-muted-foreground/50" />
                          <span className="text-sm text-muted-foreground">
                            {user.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-4 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(occurrence.startDate), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">
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
