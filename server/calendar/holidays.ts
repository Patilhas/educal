import { parseISO, isWeekend, eachDayOfInterval } from "date-fns";
import type { ICalendarRuleIssue, TCalendarRuleType } from "@/shared/calendar/types";
import Holidays from "date-holidays";

const hd = new Holidays("PT");

type RuleIssueResult = Pick<ICalendarRuleIssue, "rule" | "ruleLabel" | "field" | "date">;

export const getRuleIssue = (
  rule: TCalendarRuleType,
  startDate: string,
  endDate: string,
): RuleIssueResult | null => {
  if (rule === "weekend_start") {
    if (isWeekend(parseISO(startDate))) {
      return { rule, ruleLabel: "Fim de semana", field: "startDate", date: startDate };
    }
    return null;
  }

  if (rule === "weekend_end") {
    if (isWeekend(parseISO(endDate))) {
      return { rule, ruleLabel: "Fim de semana", field: "endDate", date: endDate };
    }
    return null;
  }

  if (rule === "weekend_range") {
    for (const day of eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })) {
      if (isWeekend(day)) {
        return { rule, ruleLabel: "Fim de semana", field: "range", date: day.toISOString() };
      }
    }
    return null;
  }

  if (rule === "holiday_start") {
    const holidayData = hd.isHoliday(parseISO(startDate));
    if (holidayData) {
      return { rule, ruleLabel: holidayData[0].name, field: "startDate", date: startDate };
    }
    return null;
  }

  if (rule === "holiday_end") {
    const holidayData = hd.isHoliday(parseISO(endDate));
    if (holidayData) {
      return { rule, ruleLabel: holidayData[0].name, field: "endDate", date: endDate };
    }
    return null;
  }

  if (rule === "holiday_range") {
    for (const day of eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })) {
      const holidayData = hd.isHoliday(day);
      if (holidayData) {
        return { rule, ruleLabel: holidayData[0].name, field: "range", date: day.toISOString() };
      }
    }
    return null;
  }

  return null;
};
