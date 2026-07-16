import ExcelJS from "exceljs";
import { eachMonthOfInterval, format, getMonth, getYear, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import type { IAcademicYearRange } from "@/shared/calendar/types";
import type { IExportRow } from "./build-export-rows";
import { getOccurrenceCellText } from "./get-occurrence-cell-text";
import { calendar } from "@/i18n/pt/calendar";

const FIXED_COLUMNS = ["Evento", "Categoria", "Classificação", "Estado", "Responsável"];
const FIXED_COLUMN_COUNT = FIXED_COLUMNS.length;

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

const resolveLabel = (dictionary: Record<string, string>, value: string): string =>
  dictionary[value] ?? value;

export const buildCalendarWorkbook = async (
  rows: IExportRow[],
  academicYear: IAcademicYearRange,
): Promise<Buffer> => {
  const months = eachMonthOfInterval({
    start: parseISO(academicYear.startDate),
    end: parseISO(academicYear.endDate),
  });

  // Excel worksheet names can't contain "/" (or * ? : \ [ ]), and academicYear.label
  // is formatted like "2025/2026", so it must be sanitized before use as a sheet name.
  const sheetName = `Calendário ${academicYear.label.replace("/", "-")}`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
  });

  const headerRow = sheet.addRow([
    ...FIXED_COLUMNS,
    ...months.map(
      (month) => `${capitalize(format(month, "MMM", { locale: pt }))}/${format(month, "yy")}`,
    ),
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" },
    };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  });

  sheet.getColumn(1).width = 32;
  for (let i = 0; i < months.length; i++) {
    sheet.getColumn(FIXED_COLUMN_COUNT + 1 + i).width = 10;
  }

  for (const row of rows) {
    const occurrenceStart = parseISO(row.startDate);
    const monthIndex = months.findIndex(
      (month) => getYear(month) === getYear(occurrenceStart) && getMonth(month) === getMonth(occurrenceStart),
    );

    const rowValues = new Array(FIXED_COLUMN_COUNT + months.length).fill("");
    rowValues[0] = row.eventName;
    rowValues[1] = resolveLabel(calendar.categories, row.category);
    rowValues[2] = resolveLabel(calendar.classifications, row.classification);
    rowValues[3] = resolveLabel(calendar.statuses, row.status);
    rowValues[4] = resolveLabel(calendar.responsibles, row.responsible);

    if (monthIndex >= 0) {
      rowValues[FIXED_COLUMN_COUNT + monthIndex] = getOccurrenceCellText(row.startDate, row.endDate);
    }

    sheet.addRow(rowValues);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
