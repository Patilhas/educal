export type TEventCategory = string;
export type TEventClassification = string;
export type TEventStatus = string;
export type TEventResponsible = string;

// ─── Reference entities (DB table rows) ─────────────────────────────────────

export interface ICategory {
  value: string;
  color: string;
}

export interface IClassification {
  value: string;
}

export interface IStatus {
  name: string;
}

export interface IResponsible {
  value: string;
}

// ─── Core entities ────────────────────────────────────────────────────────────

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
  name: string;
  objective: string;
  daysBetweenOccurrences: string;
  category: TEventCategory;
  classification: TEventClassification;
  status: TEventStatus;
  responsible: TEventResponsible;
  occurrences: IOccurrence[];
  user: IUser;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

// Shape returned by GET /api/events/enums
export interface IEventEnums {
  categories: ICategory[];
  classifications: string[];
  statuses: string[];
  responsibles: string[];
}
