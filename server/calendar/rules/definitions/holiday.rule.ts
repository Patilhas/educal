import Holidays from "date-holidays";
import type { IRuleDefinition, IRuleViolation } from "../types";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { runDayRangeCheck } from "../utils/day-range-check";

const hd = new Holidays("PT", { languages: "pt" });

type HolidayConfig = { checkStart: boolean; checkEnd: boolean; checkRange: boolean };
const MESSAGE_KEYS = { start: "startIsHoliday", end: "endIsHoliday", range: "rangeHasHoliday" } as const;
const holidayOnDay = (day: Date) => {
  const data = hd.isHoliday(day);
  return data ? data[0] : undefined;
};

export const holidayRule: IRuleDefinition = {
  id: "holiday",
  fields: [
    { id: "checkStart", type: "checkbox", defaultValue: true },
    { id: "checkEnd",   type: "checkbox", defaultValue: true },
    { id: "checkRange", type: "checkbox", defaultValue: false },
  ],
  translations: {
    pt: {
      label: "Feriado",
      fields: {
        checkStart: "Verificar início",
        checkEnd: "Verificar fim",
        checkRange: "Verificar período",
      },
      fieldLabels: {
        start: "Início",
        end: "Fim",
        range: "Período",
      },
      messages: {
        startIsHoliday: "O início coincide com o feriado {holidayName}",
        endIsHoliday: "O fim coincide com o feriado {holidayName}",
        rangeHasHoliday: "O período inclui o feriado {holidayName}",
      },
    },
  },
  validate(_event: IEvent, occurrence: IOccurrence, config: Record<string, unknown>): IRuleViolation[] {
    return runDayRangeCheck({
      occurrence,
      config: config as HolidayConfig,
      matchDay: holidayOnDay,
      toViolation: (field, date, match) => ({
        fieldLabelKey: field,
        date,
        messageKey: MESSAGE_KEYS[field],
        messageParams: { holidayName: match.name },
      }),
    });
  },
};
