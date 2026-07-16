import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/calendar/services/calendar.service", () => ({
  calendarService: {
    exportAcademicYear: async (academicYearStart: number) => ({
      academicYear: {
        startYear: academicYearStart,
        label: `${academicYearStart}/${academicYearStart + 1}`,
        startDate: `${academicYearStart}-01-01T00:00:00.000Z`,
        endDate: `${academicYearStart + 1}-09-30T23:59:59.999Z`,
      },
      rows: [],
    }),
  },
}));

import { calendarController } from "@/server/calendar/controllers/calendar.controller";

describe("calendarController.exportAcademicYear", () => {
  it("returns an xlsx response with the correct headers", async () => {
    const request = new Request("http://localhost/api/events/academic-year/export?academicYearStart=2025");
    const response = await calendarController.exportAcademicYear(request as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="calendario-2025-2026.xlsx"',
    );
  });

  it("defaults to the current year when academicYearStart is missing", async () => {
    const request = new Request("http://localhost/api/events/academic-year/export");
    const response = await calendarController.exportAcademicYear(request as never);
    expect(response.status).toBe(200);
  });
});
