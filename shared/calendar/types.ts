import type { IUser } from "@/shared/user/types";

export type TEventCategory = string;
export type TEventClassification = string;
export type TEventStatus = string;
export type TEventResponsible = string;

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

export interface IOccurrence {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface IAcademicYearRange {
  startYear: number;
  label: string;
  startDate: string;
  endDate: string;
}

export interface IAcademicYear {
  startYear: number;
  label: string;
  startDate: string;
  endDate: string;
  events: IEvent[];
}

export const CALENDAR_RULE_TYPES = [
  "weekend_start",
  "weekend_end",
  "weekend_range",
  "holiday_start",
  "holiday_end",
  "holiday_range",
] as const;

export type TCalendarRuleType = (typeof CALENDAR_RULE_TYPES)[number];

export interface ICalendarRuleIssue {
  eventId: number;
  eventName: string;
  occurrenceId: string;
  occurrenceDescription: string;
  academicYearStart: number;
  field: "startDate" | "endDate" | "range";
  date: string;
  rule: TCalendarRuleType;
  ruleLabel: string;
}

export interface IAcademicYearValidationResult {
  academicYear: IAcademicYearRange;
  totalEvents: number;
  totalOccurrences: number;
  issues: ICalendarRuleIssue[];
}

export interface IAcademicYearMigrationResult {
  sourceAcademicYear: IAcademicYearRange;
  targetAcademicYear: IAcademicYearRange;
  createdEvents: number;
  skippedEvents: number;
  issues: ICalendarRuleIssue[];
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
  rules: TCalendarRuleType[];
  occurrences: IOccurrence[];
  user: IUser;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

export interface IEventEnums {
  categories: ICategory[];
  classifications: string[];
  statuses: string[];
  responsibles: string[];
}

