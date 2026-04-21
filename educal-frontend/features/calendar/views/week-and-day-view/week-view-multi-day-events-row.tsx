import {
	addDays,
	differenceInDays,
	endOfWeek,
	isAfter,
	isBefore,
	parseISO,
	startOfDay,
	startOfWeek,
} from "date-fns";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { MonthEventBadge } from "@/features/calendar/views/month-view/month-event-badge";

interface IProps {
	selectedDate: Date;
	multiDayOccurrences: { event: IEvent; occurrence: IOccurrence }[];
}

export function WeekViewMultiDayEventsRow({
	selectedDate,
	multiDayOccurrences,
}: IProps) {
	const weekStart = startOfWeek(selectedDate);
	const weekEnd = endOfWeek(selectedDate);
	const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

	const processedOccurrences = multiDayOccurrences
		.map(({ event, occurrence }) => {
			const start = parseISO(occurrence.startDate);
			const end = parseISO(occurrence.endDate);
			const adjustedStart = isBefore(start, weekStart) ? weekStart : start;
			const adjustedEnd = isAfter(end, weekEnd) ? weekEnd : end;
			const startIndex = differenceInDays(adjustedStart, weekStart);
			const endIndex = differenceInDays(adjustedEnd, weekStart);

			return {
				event,
				occurrence,
				adjustedStart,
				adjustedEnd,
				startIndex,
				endIndex,
			};
		})
		.sort((a, b) => {
			const startDiff = a.adjustedStart.getTime() - b.adjustedStart.getTime();
			if (startDiff !== 0) return startDiff;
			return b.endIndex - b.startIndex - (a.endIndex - a.startIndex);
		});

	const occurrenceRows = processedOccurrences.reduce<typeof processedOccurrences[]>(
		(rows, item) => {
			const rowIndex = rows.findIndex((row) =>
				row.every((e) => e.endIndex < item.startIndex || e.startIndex > item.endIndex),
			);

			if (rowIndex === -1) {
				rows.push([item]);
			} else {
				rows[rowIndex] = [...rows[rowIndex], item];
			}

			return rows;
		},
		[],
	);

	const hasOccurrencesInWeek = multiDayOccurrences.some(({ occurrence }) => {
		const start = parseISO(occurrence.startDate);
		const end = parseISO(occurrence.endDate);

		return (
			(start >= weekStart && start <= weekEnd) ||
			(end >= weekStart && end <= weekEnd) ||
			(start <= weekStart && end >= weekEnd)
		);
	});

	if (!hasOccurrencesInWeek) {
		return null;
	}

	return (
		<div className="overflow-hidden flex">
			<div className="w-18 border-b"></div>
			<div className="grid flex-1 grid-cols-7 divide-x border-b border-l">
				{weekDays.map((day, dayIndex) => (
					<div
						key={day.toISOString()}
						className="flex h-full flex-col gap-1 py-1"
					>
						{occurrenceRows.map((row, rowIndex) => {
							const item = row.find(
								(e) => e.startIndex <= dayIndex && e.endIndex >= dayIndex,
							);

							if (!item) {
								return (
									<div key={`${rowIndex}-${dayIndex.toString()}`} className="h-6.5" />
								);
							}

							let position: "first" | "middle" | "last" | "none";

							if (
								dayIndex === item.startIndex &&
								dayIndex === item.endIndex
							) {
								position = "none";
							} else if (dayIndex === item.startIndex) {
								position = "first";
							} else if (dayIndex === item.endIndex) {
								position = "last";
							} else {
								position = "middle";
							}

							return (
								<MonthEventBadge
									key={`${item.occurrence.id}-${dayIndex}`}
									event={item.event}
									occurrence={item.occurrence}
									cellDate={startOfDay(day)}
									position={position}
								/>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
