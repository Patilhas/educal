import { describe, it, expect, vi } from "vitest";
import type { IEvent } from "@/shared/calendar/types";

const { fakeEvents } = vi.hoisted(() => ({ fakeEvents: { list: [] as IEvent[] } }));

vi.mock("@/server/calendar/data/calendar.data", () => ({
  calendarData: {
    listEvents: async () => fakeEvents.list,
  },
}));

import { CalendarService } from "@/server/calendar/services/calendar.service";

const baseUser: IEvent["user"] = { id: "u1", name: "Ana", picturePath: null, role: "editor" };

describe("CalendarService.exportAcademicYear", () => {
  it("returns the academic year range and rows scoped to that year only", async () => {
    fakeEvents.list = [
      {
        id: 1,
        name: "No ano",
        objective: "",
        category: "TFM",
        classification: "PLANEAMENTO",
        status: "POR_FAZER",
        responsible: "DIRECAO",
        rules: [],
        occurrences: [
          { id: "o1", description: "", startDate: "2025-09-01T00:00:00.000Z", endDate: "2025-09-01T00:00:00.000Z" },
        ],
        user: baseUser,
      },
      {
        id: 2,
        name: "Fora do ano",
        objective: "",
        category: "TFM",
        classification: "PLANEAMENTO",
        status: "POR_FAZER",
        responsible: "DIRECAO",
        rules: [],
        occurrences: [
          { id: "o2", description: "", startDate: "2024-09-01T00:00:00.000Z", endDate: "2024-09-01T00:00:00.000Z" },
        ],
        user: baseUser,
      },
    ];

    const service = new CalendarService();
    const result = await service.exportAcademicYear(2025);

    expect(result.academicYear.startYear).toBe(2025);
    expect(result.academicYear.label).toBe("2025/2026");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].eventName).toBe("No ano");
  });
});
