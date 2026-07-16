import { parseISO } from "date-fns";
import { getEventAcademicYearStart } from "@/shared/calendar/academic-year";
import type { IEvent } from "@/shared/calendar/types";

export interface IExportRow {
  eventName: string;
  category: string;
  classification: string;
  status: string;
  responsible: string;
  startDate: string;
  endDate: string;
}

export const buildExportRows = (events: IEvent[], academicYearStart: number): IExportRow[] => {
  const rows: IExportRow[] = [];

  for (const event of events) {
    if (getEventAcademicYearStart(event) !== academicYearStart) continue;

    for (const occurrence of event.occurrences) {
      rows.push({
        eventName: event.name,
        category: event.category,
        classification: event.classification,
        status: event.status,
        responsible: event.responsible,
        startDate: occurrence.startDate,
        endDate: occurrence.endDate,
      });
    }
  }

  return rows.sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
  );
};
