import { format, getDate, getMonth, getYear, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const getOccurrenceCellText = (startDate: string, endDate: string): string => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const startDay = getDate(start);
  const endDay = getDate(end);

  const sameMonth =
    getYear(start) === getYear(end) && getMonth(start) === getMonth(end);

  if (sameMonth) {
    return startDay === endDay ? `${startDay}` : `${startDay}-${endDay}`;
  }

  const endMonthAbbrev = capitalize(format(end, "MMM", { locale: pt }));
  return `${startDay} - ${endDay} ${endMonthAbbrev}`;
};
