"use client";

import { motion } from "framer-motion";
import {
  slideFromLeft,
  transition,
} from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { DateNavigator } from "@/features/calendar/header/date-navigator";
import { TodayButton } from "@/features/calendar/header/today-button";

export function CalendarHeader() {
  const { view, events } = useCalendar();

  return (
    <div className="flex flex-col gap-4 border-b p-4">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </motion.div>
    </div>
  );
}
