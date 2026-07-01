import type { IUser } from "@/shared/user/types";
import type { IRuleDefinitionMeta } from "@/shared/calendar/rules/types";

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
  minDays?: number;
  minDaysToNext?: number;
}

export interface IAcademicYearRange {
  startYear: number;
  label: string;
  startDate: string;
  endDate: string;
}

export interface IVacationPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface IAcademicYear {
  startYear: number;
  label: string;
  startDate: string;
  endDate: string;
  vacations: IVacationPeriod[];
  events: IEvent[];
}

export interface IEventRule {
  type: string;
  config: Record<string, unknown>;
}

export interface ICalendarRuleIssue {
  eventId: number;
  eventName: string;
  occurrenceId: string;
  occurrenceDescription: string;
  academicYearStart: number;
  date: string;
  ruleType: string;
  fieldLabelKey?: string;
  messageKey: string;
  messageParams?: Record<string, string>;
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
  createdVacations: number;
  skippedVacations: number;
  issues: ICalendarRuleIssue[];
}

export interface IEvent {
  id: number;
  name: string;
  objective: string;
  category: TEventCategory;
  classification: TEventClassification;
  status: TEventStatus;
  responsible: TEventResponsible;
  rules: IEventRule[];
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
  rules: IRuleDefinitionMeta[];
}

