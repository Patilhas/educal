import type {
  ICategory,
  IClassification,
  IEvent,
  IVacationPeriod,
  IResponsible,
  IStatus,
} from "@/shared/calendar/types";

export interface ICalendarRepository {
  listCategories(): Promise<ICategory[]>;
  listClassifications(): Promise<IClassification[]>;
  listStatuses(): Promise<IStatus[]>;
  listResponsibles(): Promise<IResponsible[]>;
  listEvents(): Promise<IEvent[]>;
  findEventById(eventId: number): Promise<IEvent | null>;
  insertEventIntoAcademicYear(event: IEvent, academicYearStart?: number): Promise<IEvent>;
  replaceEvent(eventId: number, event: IEvent): Promise<IEvent | null>;
  deleteEvent(eventId: number): Promise<boolean>;
  listAllVacations(): Promise<Record<number, IVacationPeriod[]>>;
  listVacations(academicYearStart: number): Promise<IVacationPeriod[]>;
  upsertVacation(academicYearStart: number, vacation: IVacationPeriod): Promise<IVacationPeriod>;
  deleteVacation(academicYearStart: number, vacationId: string): Promise<boolean>;
}
