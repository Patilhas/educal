import { motion } from "framer-motion";
import { useMemo } from "react";
import {
	staggerContainer,
	transition,
} from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";

import {
	calculateMonthEventPositions,
	getCalendarCells,
} from "@/features/calendar/helpers";

import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { DayCell } from "@/features/calendar/views/month-view/day-cell";
import {WEEK_DAYS} from "@/features/calendar/constants";

interface IProps {
	singleDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
	multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export default function CalendarMonthView({ singleDayOccurrences, multiDayOccurrences }: IProps) {
	const { selectedDate } = useCalendar();

	const allOccurrences = [...multiDayOccurrences, ...singleDayOccurrences];

	const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

	const eventPositions = useMemo(
		() =>
			calculateMonthEventPositions(
				multiDayOccurrences,
				singleDayOccurrences,
				selectedDate,
			),
		[multiDayOccurrences, singleDayOccurrences, selectedDate],
	);

	return (
		<motion.div initial="initial" animate="animate" variants={staggerContainer}>
			<div className="grid grid-cols-7">
				{WEEK_DAYS.map((day, index) => (
					<motion.div
						key={day}
						className="flex items-center justify-center py-2"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05, ...transition }}
					>
						<span className="text-xs font-medium text-muted-foreground/70">{day}</span>
					</motion.div>
				))}
			</div>

			<div className="grid grid-cols-7 overflow-hidden">
				{cells.map((cell) => (
					<DayCell
						key={cell.date.toISOString()}
						cell={cell}
						occurrences={allOccurrences}
						eventPositions={eventPositions}
					/>
				))}
			</div>
		</motion.div>
	);
}
