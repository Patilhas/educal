import { endOfDay, formatDate, getYear, isSameDay, isSameMonth, parseISO, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { staggerContainer, transition } from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { EventListDialog } from "@/features/calendar/dialogs/events-list-dialog";
import { getCalendarCells } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";
import { WEEK_DAYS } from "@/features/calendar/constants";

interface IProps {
  singleDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
  multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export default function CalendarYearView({ singleDayOccurrences, multiDayOccurrences }: IProps) {
  const { selectedDate, setSelectedDate, getEventColor } = useCalendar();
  const currentYear = getYear(selectedDate);
  const allOccurrences = [...multiDayOccurrences, ...singleDayOccurrences];

  return (
    <div className="flex h-full min-h-0 flex-col p-4 sm:p-6">
      {/* Year grid */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid h-full min-h-0 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {[...Array(12)].map((_, monthIndex) => {
          const monthDate = new Date(currentYear, monthIndex, 1);
          const month = formatDate(monthDate, "MMMM");
          const cells = getCalendarCells(monthDate);

          return (
            <motion.div
              key={month}
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: monthIndex * 0.05, ...transition }}
              aria-label={`${month} ${currentYear} calendar`}
            >
              {/* Month header */}
              <button
                type="button"
                className="w-full px-3 py-2 text-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-primary/20 transition-colors bg-transparent border-none appearance-none"
                onClick={() =>
                  setSelectedDate(new Date(currentYear, monthIndex, 1))
                }
                aria-label={`Selecionar ${month}`}
              >
                {month}
              </button>

              <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground py-2">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="p-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-7 gap-0.5 p-1.5 text-xs">
                {cells.map((cell) => {
                  const isCurrentMonth = isSameMonth(cell.date, monthDate);
                  const isToday = isSameDay(cell.date, new Date());
                  const dayStart = startOfDay(cell.date);
                  const dayEnd = endOfDay(cell.date);
                  const dayOccurrences = allOccurrences.filter(({ occurrence }) => {
                    const occurrenceStart = parseISO(occurrence.startDate);
                    const occurrenceEnd = parseISO(occurrence.endDate);

                    return (
                      (occurrenceStart <= dayEnd && occurrenceEnd >= dayStart) ||
                      isSameDay(occurrenceStart, cell.date) ||
                      isSameDay(occurrenceEnd, cell.date)
                    );
                  });
                  const hasOccurrences = dayOccurrences.length > 0;

                  return (
                    <div
                      key={cell.date.toISOString()}
                      className={cn(
                        "relative flex min-h-8 flex-col items-center justify-start p-1",
                        !isCurrentMonth && "text-muted-foreground/40",
                        hasOccurrences && isCurrentMonth
                          ? "cursor-pointer hover:bg-accent/20 hover:rounded-md"
                          : "cursor-default",
                      )}
                    >
                      {isCurrentMonth && hasOccurrences ? (
                        <EventListDialog date={cell.date} occurrences={dayOccurrences}>
                          <div className="w-full h-full flex flex-col items-center justify-start gap-0.5">
                            <span
                              className={cn(
                                "size-5 flex items-center justify-center font-medium",
                                isToday &&
                                "rounded-full bg-primary text-primary-foreground",
                              )}
                            >
                              {cell.day}
                            </span>
                            <div className="flex justify-center items-center gap-0.5">
                              {dayOccurrences.length <= 2 ? (
                                dayOccurrences
                                  .slice(0, 2)
                                  .map(({ event }) => (
                                    <EventBullet
                                      key={event.id}
                                      color={getEventColor(event.category)}
                                      className="size-1.5"
                                    />
                                  ))
                              ) : (
                                <div className="flex flex-col justify-center items-center">
                                  <EventBullet
                                    color={getEventColor(dayOccurrences[0].event.category)}
                                    className="size-1.5"
                                  />
                                  <span className="text-[0.6rem]">
                                    +{dayOccurrences.length - 1}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </EventListDialog>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-start">
                          <span
                            className={cn(
                              "size-5 flex items-center justify-center font-medium",
                            )}
                          >
                            {cell.day}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
