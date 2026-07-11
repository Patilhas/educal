import { parseISO, eachDayOfInterval } from "date-fns";
import type { IOccurrence } from "@/shared/calendar/types";
import type { IRuleViolation } from "../types";

type DayRangeField = "start" | "end" | "range";

interface DayRangeCheckOptions<TMatch> {
  occurrence: IOccurrence;
  config: { checkStart: boolean; checkEnd: boolean; checkRange: boolean };
  matchDay: (day: Date) => TMatch | undefined;
  matchRange?: (start: Date, end: Date) => TMatch | undefined;
  toViolation: (field: DayRangeField, date: string, match: TMatch) => IRuleViolation;
}

// Shared checkStart/checkEnd/checkRange loop used by the Weekend, Holiday, and Vacation period rules
export function runDayRangeCheck<TMatch>({
  occurrence,
  config,
  matchDay,
  matchRange,
  toViolation,
}: DayRangeCheckOptions<TMatch>): IRuleViolation[] {
  const violations: IRuleViolation[] = [];
  const start = parseISO(occurrence.startDate);
  const end = parseISO(occurrence.endDate);

  if (config.checkStart) {
    const match = matchDay(start);
    if (match) violations.push(toViolation("start", occurrence.startDate, match));
  }
  if (config.checkEnd) {
    const match = matchDay(end);
    if (match) violations.push(toViolation("end", occurrence.endDate, match));
  }
  if (config.checkRange) {
    if (matchRange) {
      const match = matchRange(start, end);
      if (match) violations.push(toViolation("range", occurrence.startDate, match));
    } else {
      for (const day of eachDayOfInterval({ start, end })) {
        const match = matchDay(day);
        if (match) {
          violations.push(toViolation("range", day.toISOString(), match));
          break;
        }
      }
    }
  }

  return violations;
}
