import type { TEventColor } from "@/features/calendar/types";
import type {
	EVENT_CATEGORIES,
	EVENT_CLASSIFICATIONS,
	EVENT_RESPONSIBLES,
	EVENT_STATUSES,
} from "@/features/calendar/constants";

type TEventCategory = (typeof EVENT_CATEGORIES)[number];
type TEventClassification = (typeof EVENT_CLASSIFICATIONS)[number];
type TEventStatus = (typeof EVENT_STATUSES)[number];
type TEventResponsible = (typeof EVENT_RESPONSIBLES)[number];

export interface IUser {
	id: string;
	name: string;
	picturePath: string | null;
}

export interface IOccurrence {
	id: string;
	description: string;
	startDate: string;
	endDate: string;
}

export interface IEvent {
	id: number;
	startDate: string;
	endDate: string;
	name: string;
	objective: string;
	daysBetweenOccurrences: string;
	category: TEventCategory;
	classification: TEventClassification;
	status: TEventStatus;
	responsible: TEventResponsible;
	description: string;
	occurrences: IOccurrence[];
	color: TEventColor;
	user: IUser;
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
