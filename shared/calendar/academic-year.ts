import type { IAcademicYearRange, IEvent } from "@/shared/calendar/types";

export const getAcademicYearLabel = (startYear: number): string => {
  return `${startYear}/${startYear + 1}`;
};

export const getAcademicYearRange = (startYear: number): IAcademicYearRange => {
  const startDate = new Date(startYear, 0, 1, 0, 0, 0, 0);
  const endDate = new Date(startYear + 1, 8, 30, 23, 59, 59, 999);

  return {
    startYear,
    label: getAcademicYearLabel(startYear),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export const getAcademicYearOptions = (anchorYear: number, span = 2): number[] => {
  return Array.from({ length: span * 2 + 1 }, (_, index) => anchorYear - span + index);
};

export const getEventAcademicYearStart = (event: Pick<IEvent, "occurrences">): number => {
  const fallbackDate = event.occurrences[0]?.startDate ?? new Date().toISOString();
  return new Date(fallbackDate).getFullYear();
};

export const shiftDateByYears = (dateValue: string, years: number): string => {
  const source = new Date(dateValue);
  const target = new Date(dateValue);
  target.setFullYear(source.getFullYear() + years);

  if (target.getMonth() !== source.getMonth()) {
    target.setDate(0);
  }

  return target.toISOString();
};
