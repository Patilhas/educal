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

export type TAlertUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export interface IAlert {
  id: string;
  value: number;
  unit: TAlertUnit;
}

export interface IOccurrence {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
  alerts: IAlert[];
}

export interface IEmailTemplate {
  recipients: string[];
  content: string;
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
  emailTemplate: IEmailTemplate | null;
}

export interface INotification {
  id: string;
  eventId: number;
  occurrenceId: string;
  unreadIds: string[];
  triggeredAt: string;
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
