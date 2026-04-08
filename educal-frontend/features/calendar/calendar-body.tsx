"use client";

import { isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { fadeIn, transition } from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AgendaEvents } from "@/features/calendar/views/agenda-view/agenda-events";
import { CalendarMonthView } from "@/features/calendar/views/month-view/calendar-month-view";
import { CalendarDayView } from "@/features/calendar/views/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/features/calendar/views/week-and-day-view/calendar-week-view";
import { CalendarYearView } from "@/features/calendar/views/year-view/calendar-year-view";

export function CalendarBody() {
  const { view, events } = useCalendar();

  // Transform events with occurrences into flat list with occurrence data
  // Each item has event data + occurrence data
  const eventOccurrences = events.flatMap((event) =>
    event.occurrences.map((occurrence) => ({
      event,
      occurrence,
    }))
  );

  const singleDayOccurrences = eventOccurrences.filter(({ occurrence }) => {
    const startDate = parseISO(occurrence.startDate);
    const endDate = parseISO(occurrence.endDate);
    return isSameDay(startDate, endDate);
  });

  const multiDayOccurrences = eventOccurrences.filter(({ occurrence }) => {
    const startDate = parseISO(occurrence.startDate);
    const endDate = parseISO(occurrence.endDate);
    return !isSameDay(startDate, endDate);
  });

  return (
    <div className="w-full h-full overflow-scroll relative">
      <motion.div
        key={view}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeIn}
        transition={transition}
      >
        {view === "month" && (
          <CalendarMonthView
            singleDayOccurrences={singleDayOccurrences}
            multiDayOccurrences={multiDayOccurrences}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            singleDayOccurrences={singleDayOccurrences}
            multiDayOccurrences={multiDayOccurrences}
          />
        )}
        {view === "day" && (
          <CalendarDayView
            singleDayOccurrences={singleDayOccurrences}
            multiDayOccurrences={multiDayOccurrences}
          />
        )}
        {view === "year" && (
          <CalendarYearView
            singleDayOccurrences={singleDayOccurrences}
            multiDayOccurrences={multiDayOccurrences}
          />
        )}
        {view === "agenda" && (
          <motion.div
            key="agenda"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
            transition={transition}
          >
            <AgendaEvents />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
