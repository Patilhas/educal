import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildCalendarWorkbook } from "./build-calendar-workbook";
import type { IExportRow } from "./build-export-rows";
import { getAcademicYearRange } from "@/shared/calendar/academic-year";

const academicYear = getAcademicYearRange(2025);

const readBack = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  // exceljs's shipped types declare `load(buffer: Buffer, ...)` against a Buffer
  // shape that doesn't structurally match this project's @types/node Buffer<T>
  // (a known exceljs/@types/node type mismatch, not a real runtime issue — the
  // same ambient Buffer name resolves identically everywhere in this project, so
  // an `as unknown as Buffer` cast can't paper over it; `any` is the pragmatic exit).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);
  return workbook;
};

describe("buildCalendarWorkbook", () => {
  it("names the sheet after the academic year, with '/' replaced since Excel sheet names can't contain it", async () => {
    const buffer = await buildCalendarWorkbook([], academicYear);
    const workbook = await readBack(buffer);
    expect(workbook.worksheets[0].name).toBe("Calendário 2025-2026");
  });

  it("writes a header row with the fixed columns followed by 21 month columns spanning both years", async () => {
    const buffer = await buildCalendarWorkbook([], academicYear);
    const workbook = await readBack(buffer);
    const sheet = workbook.worksheets[0];
    const headerValues = sheet.getRow(1).values as unknown[];
    // ExcelJS row.values is 1-indexed with a leading undefined at index 0
    expect(headerValues.slice(1, 6)).toEqual([
      "Evento",
      "Categoria",
      "Classificação",
      "Estado",
      "Responsável",
    ]);
    expect(headerValues.slice(6)).toEqual([
      "Jan/25", "Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25", "Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25",
      "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26", "Set/26",
    ]);
  });

  it("writes translated labels and the occurrence day into the matching month column, disambiguating repeated month names by year", async () => {
    const rows: IExportRow[] = [
      {
        eventName: "Reunião de Pais",
        category: "TFM",
        classification: "PLANEAMENTO",
        status: "POR_FAZER",
        responsible: "DIRECAO",
        startDate: "2025-12-10T00:00:00.000Z",
        endDate: "2025-12-10T00:00:00.000Z",
      },
      {
        eventName: "Exame de Recurso",
        category: "TFM",
        classification: "EXECUCAO",
        status: "POR_FAZER",
        responsible: "DIRECAO",
        startDate: "2026-01-20T00:00:00.000Z",
        endDate: "2026-01-20T00:00:00.000Z",
      },
    ];

    const buffer = await buildCalendarWorkbook(rows, academicYear);
    const workbook = await readBack(buffer);
    const sheet = workbook.worksheets[0];
    const decRow = sheet.getRow(2).values as unknown[];
    const nextJanRow = sheet.getRow(3).values as unknown[];

    expect(decRow.slice(1, 6)).toEqual([
      "Reunião de Pais",
      "TFM",
      "Planeamento",
      "Por fazer",
      "Direção",
    ]);
    // Dez/25 is month index 11 (0-based) -> row.values position 6 + 11 = 17
    expect(decRow[17]).toBe("10");

    // Jan/26 is month index 12 (0-based) -> row.values position 6 + 12 = 18,
    // distinct from Jan/25 at position 6, proving the two "Jan" columns don't collide.
    expect(nextJanRow[18]).toBe("20");
    // Unset month cells round-trip as "" (empty string), not undefined — ExcelJS
    // doesn't distinguish "never written" from "written as empty string" on read-back.
    expect(nextJanRow[6]).toBe("");
  });

  it("produces a header-only sheet when there are no rows", async () => {
    const buffer = await buildCalendarWorkbook([], academicYear);
    const workbook = await readBack(buffer);
    expect(workbook.worksheets[0].rowCount).toBe(1);
  });
});
