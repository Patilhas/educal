import { addDays, isWeekend } from "date-fns";
import Holidays from "date-holidays";

const hd = new Holidays("PT");

function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !hd.isHoliday(date);
}

/** Counts working days strictly between `from` and `to` (both exclusive). */
export function countWorkingDaysBetween(from: Date, to: Date): number {
  if (from >= to) return 0;
  let count = 0;
  let cursor = addDays(from, 1);
  while (cursor < to) {
    if (isWorkingDay(cursor)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}

/** Counts working days from `start` to `end` (both inclusive). */
export function countWorkingDaysInclusive(start: Date, end: Date): number {
  if (start > end) return 0;
  let count = 0;
  let cursor = new Date(start);
  while (cursor <= end) {
    if (isWorkingDay(cursor)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}
