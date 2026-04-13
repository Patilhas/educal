import {addDays, format, isSameDay, parseISO, startOfWeek} from "date-fns";
import {motion} from "framer-motion";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
    fadeIn,
    staggerContainer,
    transition,
} from "@/features/calendar/animations";
import {useCalendar} from "@/features/calendar/contexts/calendar-context";
import {groupOccurrences} from "@/features/calendar/helpers";
import type {IEvent, IOccurrence} from "@/features/calendar/interfaces";
import {CalendarTimeline} from "@/features/calendar/views/week-and-day-view/calendar-time-line";
import {RenderGroupedEvents} from "@/features/calendar/views/week-and-day-view/render-grouped-events";
import { TimeGridDaySlots } from "@/features/calendar/views/week-and-day-view/time-grid-day-slots";
import { TimeGridHoursColumn } from "@/features/calendar/views/week-and-day-view/time-grid-hours-column";
import {
    WeekViewMultiDayEventsRow
} from "@/features/calendar/views/week-and-day-view/week-view-multi-day-events-row";

interface IProps {
    singleDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
    multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export default function CalendarWeekView({singleDayOccurrences, multiDayOccurrences}: IProps) {
    const {selectedDate, use24HourFormat} = useCalendar();

    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
    const hours = Array.from({length: 24}, (_, i) => i);

    return (
        <motion.div
            className="flex h-full min-h-0 flex-col"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
            transition={transition}
        >
            <motion.div
                className="flex flex-col items-center justify-center border-b p-4 text-sm sm:hidden"
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                transition={transition}
            >
                <p>A vista semanal não é recomendada em dispositivos pequenos.</p>
                <p>Use um ecrã maior ou mude para a vista diária.</p>
            </motion.div>

            <motion.div
                className="min-h-0 flex-1 flex-col sm:flex"
                variants={staggerContainer}
            >
                <div className="shrink-0">
                    <WeekViewMultiDayEventsRow
                        selectedDate={selectedDate}
                        multiDayOccurrences={multiDayOccurrences}
                    />

                    {/* Week header */}
                    <motion.div
                        className="relative z-20 flex border-b"
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        transition={transition}
                    >
                        {/* Time column header - responsive width */}
                        <div className="w-18"></div>
                        <div className="grid flex-1 grid-cols-7  border-l">
                            {weekDays.map((day, index) => (
                                <motion.span
                                    key={day.toISOString()}
                                    className="py-1 sm:py-2 text-center text-xs font-medium text-muted-foreground/70"
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: index * 0.05, ...transition}}
                                >
                                    {/* Mobile: Show only day abbreviation and number */}
                                    <span className="block sm:hidden">
									{format(day, "EEE").charAt(0)}
                                        <span className="block font-semibold text-foreground text-xs">
										{format(day, "d")}
									</span>
								</span>
                                    {/* Desktop: Show full format */}
                                    <span className="hidden sm:inline">
									{format(day, "EE")}{" "}
                                        <span className="ml-1 font-semibold text-foreground">
										{format(day, "d")}
									</span>
								</span>
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                </div>

                <ScrollArea className="h-full min-h-0 flex-1" type="always">
                    <div className="flex">
                        {/* Hours column */}
                        <TimeGridHoursColumn
                            hours={hours}
                            use24HourFormat={use24HourFormat}
                        />

                        {/* Week grid */}
                        <motion.div
                            className="relative flex-1 border-l"
                            variants={staggerContainer}
                        >
                            <div className="grid grid-cols-7 divide-x">
                                {weekDays.map((day, dayIndex) => {
                                    const dayOccurrences = singleDayOccurrences.filter(
                                        ({ occurrence }) =>
                                            isSameDay(parseISO(occurrence.startDate), day) ||
                                            isSameDay(parseISO(occurrence.endDate), day),
                                    );
                                    const groupedOccurrences = groupOccurrences(dayOccurrences);

                                    return (
                                        <motion.div
                                            key={day.toISOString()}
                                            className="relative"
                                            initial={{opacity: 0}}
                                            animate={{opacity: 1}}
                                            transition={{delay: dayIndex * 0.1, ...transition}}
                                        >
                                            <TimeGridDaySlots day={day} hours={hours} />

                                            <RenderGroupedEvents
                                                groupedOccurrences={groupedOccurrences}
                                                day={day}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <CalendarTimeline/>
                        </motion.div>
                    </div>
                </ScrollArea>
            </motion.div>
        </motion.div>
    );
}


