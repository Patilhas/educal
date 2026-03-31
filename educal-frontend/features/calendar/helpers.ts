import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	differenceInDays,
	differenceInMinutes,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	isSameDay,
	isSameMonth,
	isSameWeek,
	isSameYear,
	isValid,
	parseISO,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subDays,
	subMonths,
	subWeeks,
	subYears,
} from "date-fns";
import type {
	ICalendarCell,
	IEvent,
	IOccurrence,
} from "@/features/calendar/interfaces";
import type {
	TCalendarView,
	TEventColor,
} from "@/features/calendar/types";

const FORMAT_STRING = "MMM d, yyyy";

export function rangeText(view: TCalendarView, date: Date): string {
	let start: Date;
	let end: Date;

	switch (view) {
		case "month":
			start = startOfMonth(date);
			end = endOfMonth(date);
			break;
		case "week":
			start = startOfWeek(date);
			end = endOfWeek(date);
			break;
		case "day":
			return format(date, FORMAT_STRING);
		case "year":
			start = startOfYear(date);
			end = endOfYear(date);
			break;
		case "agenda":
			start = startOfMonth(date);
			end = endOfMonth(date);
			break;
		default:
			return "Erro ao formatar";
	}

	return `${format(start, FORMAT_STRING)} - ${format(end, FORMAT_STRING)}`;
}

export function navigateDate(
	date: Date,
	view: TCalendarView,
	direction: "previous" | "next",
): Date {
	const operations: Record<TCalendarView, (d: Date, n: number) => Date> = {
		month: direction === "next" ? addMonths : subMonths,
		week: direction === "next" ? addWeeks : subWeeks,
		day: direction === "next" ? addDays : subDays,
		year: direction === "next" ? addYears : subYears,
		agenda: direction === "next" ? addMonths : subMonths,
	};

	return operations[view](date, 1);
}

export function getEventsCount(
	events: IEvent[],
	date: Date,
	view: TCalendarView,
): number {
	const compareFns: Record<TCalendarView, (d1: Date, d2: Date) => boolean> = {
		day: isSameDay,
		week: isSameWeek,
		month: isSameMonth,
		year: isSameYear,
		agenda: isSameMonth,
	};

	const compareFn = compareFns[view];
	
	// Count occurrences instead of events
	let count = 0;
	for (const event of events) {
		for (const occurrence of event.occurrences) {
			if (compareFn(parseISO(occurrence.startDate), date)) {
				count++;
			}
		}
	}
	return count;
}

export function groupOccurrences(
	dayOccurrences: { event: IEvent; occurrence: IOccurrence }[]
): { event: IEvent; occurrence: IOccurrence }[][] {
	const sortedOccurrences = dayOccurrences.sort((a, b) =>
		parseISO(a.occurrence.startDate).getTime() - parseISO(b.occurrence.startDate).getTime()
	);
	const groups: { event: IEvent; occurrence: IOccurrence }[][] = [];

	for (const item of sortedOccurrences) {
		const occurrenceStart = parseISO(item.occurrence.startDate);
		let placed = false;

		for (const group of groups) {
			const lastItemInGroup = group[group.length - 1];
			const lastOccurrenceEnd = parseISO(lastItemInGroup.occurrence.endDate);

			if (occurrenceStart >= lastOccurrenceEnd) {
				group.push(item);
				placed = true;
				break;
			}
		}

		if (!placed) groups.push([item]);
	}

	return groups;
}

export function getOccurrenceBlockStyle(
	occurrence: IOccurrence,
	day: Date,
	groupIndex: number,
	groupSize: number,
) {
	const startDate = parseISO(occurrence.startDate);
	const dayStart = startOfDay(day);
	const occurrenceStart = startDate < dayStart ? dayStart : startDate;
	const startMinutes = differenceInMinutes(occurrenceStart, dayStart);

	const top = (startMinutes / 1440) * 100; // 1440 minutes in a day
	const width = 100 / groupSize;
	const left = groupIndex * width;

	return { top: `${top}%`, width: `${width}%`, left: `${left}%` };
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
	const year = selectedDate.getFullYear();
	const month = selectedDate.getMonth();

	const daysInMonth = endOfMonth(selectedDate).getDate(); // Faster than new Date(year, month + 1, 0)
	const firstDayOfMonth = startOfMonth(selectedDate).getDay();
	const daysInPrevMonth = endOfMonth(new Date(year, month - 1)).getDate();
	const totalDays = firstDayOfMonth + daysInMonth;

	const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
		day: daysInPrevMonth - firstDayOfMonth + i + 1,
		currentMonth: false,
		date: new Date(year, month - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
	}));

	const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
		day: i + 1,
		currentMonth: true,
		date: new Date(year, month, i + 1),
	}));

	const nextMonthCells = Array.from(
		{ length: (7 - (totalDays % 7)) % 7 },
		(_, i) => ({
			day: i + 1,
			currentMonth: false,
			date: new Date(year, month + 1, i + 1),
		}),
	);

	return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
	multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[],
	singleDayOccurrences: { event: IEvent; occurrence: IOccurrence }[],
	selectedDate: Date,
): Record<string, number> {
	const monthStart = startOfMonth(selectedDate);
	const monthEnd = endOfMonth(selectedDate);

	const eventPositions: Record<string, number> = {};
	const occupiedPositions: Record<string, boolean[]> = {};

	eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
		occupiedPositions[day.toISOString()] = [false, false, false];
	});

	const sortedOccurrences = [
		...multiDayOccurrences.sort((a, b) => {
			const aDuration = differenceInDays(
				parseISO(a.occurrence.endDate),
				parseISO(a.occurrence.startDate),
			);
			const bDuration = differenceInDays(
				parseISO(b.occurrence.endDate),
				parseISO(b.occurrence.startDate),
			);
			return (
				bDuration - aDuration ||
				parseISO(a.occurrence.startDate).getTime() - parseISO(b.occurrence.startDate).getTime()
			);
		}),
		...singleDayOccurrences.sort(
			(a, b) =>
				parseISO(a.occurrence.startDate).getTime() - parseISO(b.occurrence.startDate).getTime(),
		),
	];

	sortedOccurrences.forEach(({ occurrence }) => {
		const occurrenceStart = parseISO(occurrence.startDate);
		const occurrenceEnd = parseISO(occurrence.endDate);
		const occurrenceDays = eachDayOfInterval({
			start: occurrenceStart < monthStart ? monthStart : occurrenceStart,
			end: occurrenceEnd > monthEnd ? monthEnd : occurrenceEnd,
		});

		let position = -1;

		for (let i = 0; i < 3; i++) {
			if (
				occurrenceDays.every((day) => {
					const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
					return dayPositions && !dayPositions[i];
				})
			) {
				position = i;
				break;
			}
		}

		if (position !== -1) {
			occurrenceDays.forEach((day) => {
				const dayKey = startOfDay(day).toISOString();
				occupiedPositions[dayKey][position] = true;
			});
			eventPositions[occurrence.id] = position;
		}
	});

	return eventPositions;
}

export function getMonthCellEvents(
	date: Date,
	occurrences: { event: IEvent; occurrence: IOccurrence }[],
	eventPositions: Record<string, number>,
) {
	const dayStart = startOfDay(date);
	const occurrencesForDate = occurrences.filter(({ occurrence }) => {
		const occurrenceStart = parseISO(occurrence.startDate);
		const occurrenceEnd = parseISO(occurrence.endDate);
		return (
			(dayStart >= occurrenceStart && dayStart <= occurrenceEnd) ||
			isSameDay(dayStart, occurrenceStart) ||
			isSameDay(dayStart, occurrenceEnd)
		);
	});

	return occurrencesForDate
		.map(({ event, occurrence }) => ({
			event,
			occurrence,
			position: eventPositions[occurrence.id] ?? -1,
			isMultiDay: occurrence.startDate !== occurrence.endDate,
		}))
		.sort((a, b) => {
			if (a.isMultiDay && !b.isMultiDay) return -1;
			if (!a.isMultiDay && b.isMultiDay) return 1;
			return a.position - b.position;
		});
}

export function formatTime(
	date: Date | string,
	use24HourFormat: boolean,
): string {
	const parsedDate = typeof date === "string" ? parseISO(date) : date;
	if (!isValid(parsedDate)) return "";
	return format(parsedDate, use24HourFormat ? "HH:mm" : "h:mm a");
}

export const getFirstLetters = (str: string): string => {
	if (!str) return "";
	const words = str.split(" ");
	if (words.length === 1) return words[0].charAt(0).toUpperCase();
	return `${words[0].charAt(0).toUpperCase()}${words[1].charAt(0).toUpperCase()}`;
};

export const getEventsForMonth = (occurrences: { event: IEvent; occurrence: IOccurrence }[], date: Date): { event: IEvent; occurrence: IOccurrence }[] => {
	const startOfMonthDate = startOfMonth(date);
	const endOfMonthDate = endOfMonth(date);

	return occurrences.filter(({ occurrence }) => {
		const occurrenceStart = parseISO(occurrence.startDate);
		const occurrenceEnd = parseISO(occurrence.endDate);
		return (
			isValid(occurrenceStart) &&
			isValid(occurrenceEnd) &&
			occurrenceStart <= endOfMonthDate &&
			occurrenceEnd >= startOfMonthDate
		);
	});
};

export const getColorClass = (color: string): string => {
	const colorClasses: Record<TEventColor, string> = {
		red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
		yellow:
			"border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
		green:
			"border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
		blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
		orange:
			"border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
		purple:
			"border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
	};
	return colorClasses[color as TEventColor] || "";
};

export const getBgColor = (color: string): string => {
	const colorClasses: Record<TEventColor, string> = {
		red: "bg-red-400 dark:bg-red-600",
		yellow: "bg-yellow-400 dark:bg-yellow-600",
		green: "bg-green-400 dark:bg-green-600",
		blue: "bg-blue-400 dark:bg-blue-600",
		orange: "bg-orange-400 dark:bg-orange-600",
		purple: "bg-purple-400 dark:bg-purple-600",
	};
	return colorClasses[color as TEventColor] || "";
};

export const toCapitalize = (str: string): string => {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
};
