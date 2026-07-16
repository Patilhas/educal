import { describe, it, expect } from "vitest";
import { buildExportRows } from "./build-export-rows";
import type { IEvent } from "@/shared/calendar/types";

const baseUser = { id: "u1", name: "Ana", email: "ana@example.com", role: "editor" } as IEvent["user"];

const makeEvent = (overrides: Partial<IEvent> = {}): IEvent => ({
  id: 1,
  name: "Reunião de Pais",
  objective: "Ponto de situação",
  category: "TFM",
  classification: "PLANEAMENTO",
  status: "POR_FAZER",
  responsible: "DIRECAO",
  rules: [],
  occurrences: [],
  user: baseUser,
  ...overrides,
});

describe("buildExportRows", () => {
  it("produces one row per occurrence", () => {
    const event = makeEvent({
      occurrences: [
        { id: "o1", description: "1º período", startDate: "2025-09-15T00:00:00.000Z", endDate: "2025-09-15T00:00:00.000Z" },
        { id: "o2", description: "2º período", startDate: "2025-12-10T00:00:00.000Z", endDate: "2025-12-10T00:00:00.000Z" },
      ],
    });

    const rows = buildExportRows([event], 2025);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      eventName: "Reunião de Pais",
      category: "TFM",
      classification: "PLANEAMENTO",
      status: "POR_FAZER",
      responsible: "DIRECAO",
      startDate: "2025-09-15T00:00:00.000Z",
      endDate: "2025-09-15T00:00:00.000Z",
    });
  });

  it("sorts rows chronologically by startDate across events", () => {
    const eventA = makeEvent({
      id: 1,
      name: "Evento A",
      occurrences: [{ id: "a1", description: "", startDate: "2025-12-01T00:00:00.000Z", endDate: "2025-12-01T00:00:00.000Z" }],
    });
    const eventB = makeEvent({
      id: 2,
      name: "Evento B",
      occurrences: [{ id: "b1", description: "", startDate: "2025-09-01T00:00:00.000Z", endDate: "2025-09-01T00:00:00.000Z" }],
    });

    const rows = buildExportRows([eventA, eventB], 2025);

    expect(rows.map((r) => r.eventName)).toEqual(["Evento B", "Evento A"]);
  });

  it("excludes events outside the requested academic year", () => {
    const inYear = makeEvent({
      id: 1,
      name: "Dentro do ano",
      occurrences: [{ id: "o1", description: "", startDate: "2025-09-01T00:00:00.000Z", endDate: "2025-09-01T00:00:00.000Z" }],
    });
    const outOfYear = makeEvent({
      id: 2,
      name: "Fora do ano",
      occurrences: [{ id: "o2", description: "", startDate: "2024-09-01T00:00:00.000Z", endDate: "2024-09-01T00:00:00.000Z" }],
    });

    const rows = buildExportRows([inYear, outOfYear], 2025);

    expect(rows.map((r) => r.eventName)).toEqual(["Dentro do ano"]);
  });

  it("produces no row for an event with zero occurrences", () => {
    const event = makeEvent({ occurrences: [] });
    const rows = buildExportRows([event], 2025);
    expect(rows).toEqual([]);
  });

  it("produces separate rows for the same event with multiple occurrences in the same month", () => {
    const event = makeEvent({
      occurrences: [
        { id: "o1", description: "", startDate: "2025-10-05T00:00:00.000Z", endDate: "2025-10-05T00:00:00.000Z" },
        { id: "o2", description: "", startDate: "2025-10-20T00:00:00.000Z", endDate: "2025-10-20T00:00:00.000Z" },
      ],
    });

    const rows = buildExportRows([event], 2025);

    expect(rows).toHaveLength(2);
    expect(rows[0].startDate).toBe("2025-10-05T00:00:00.000Z");
    expect(rows[1].startDate).toBe("2025-10-20T00:00:00.000Z");
  });
});
