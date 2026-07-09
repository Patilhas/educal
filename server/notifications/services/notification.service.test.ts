import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { countWorkingDaysBetween } from "@/server/calendar/rules/utils/working-days";
import { NotificationService } from "@/server/notifications/services/notification.service";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";

// vi.mock calls are hoisted above all imports by Vite's transform, so the fake
// stores they close over must be created via vi.hoisted rather than referenced
// from outer scope — this also means NotificationService above is safe to
// import normally, since the module.data mocks are already in place by the
// time it (and its calendarData/notificationData imports) resolves.
const { fakeEvents, fakeNotificationDb } = vi.hoisted(() => ({
  fakeEvents: { list: [] as IEvent[] },
  fakeNotificationDb: {
    records: [] as { id: string; occurrenceId: string; occurrenceStartDateAtGen: string; leadDaysAtGen: number | null; createdAt: string }[],
    reads: [] as { notificationId: string; userId: string }[],
  },
}));

vi.mock("@/server/calendar/data/calendar.data", () => ({
  calendarData: {
    listEvents: async () => fakeEvents.list,
  },
}));

vi.mock("@/server/notifications/data/notification.data", () => ({
  notificationData: {
    listAll: async () => structuredClone(fakeNotificationDb.records),
    insertMany: async (records: { id: string; occurrenceId: string; occurrenceStartDateAtGen: string; leadDaysAtGen: number | null; createdAt: string }[]) => {
      fakeNotificationDb.records.push(...records);
    },
    deleteManyByOccurrenceIds: async (occurrenceIds: string[]) => {
      const idSet = new Set(occurrenceIds);
      const removedIds = fakeNotificationDb.records
        .filter((r) => idSet.has(r.occurrenceId))
        .map((r) => r.id);
      fakeNotificationDb.records = fakeNotificationDb.records.filter((r) => !idSet.has(r.occurrenceId));
      fakeNotificationDb.reads = fakeNotificationDb.reads.filter((r) => !removedIds.includes(r.notificationId));
    },
    listReadNotificationIdsForUser: async (userId: string) =>
      fakeNotificationDb.reads.filter((r) => r.userId === userId).map((r) => r.notificationId),
    markRead: async (notificationId: string, userId: string) => {
      fakeNotificationDb.reads.push({ notificationId, userId });
    },
    markAllRead: async (notificationIds: string[], userId: string) => {
      for (const notificationId of notificationIds) {
        fakeNotificationDb.reads.push({ notificationId, userId });
      }
    },
  },
}));

const NOW = new Date("2026-01-05T00:00:00.000Z");

function occurrenceAtWorkingDayDistance(distance: number): string {
  let candidate = addDays(NOW, 1);
  while (countWorkingDaysBetween(NOW, candidate) < distance) {
    candidate = addDays(candidate, 1);
  }
  return candidate.toISOString();
}

function occurrenceBeyondWorkingDayDistance(distance: number): string {
  let candidate = addDays(NOW, 1);
  while (countWorkingDaysBetween(NOW, candidate) <= distance) {
    candidate = addDays(candidate, 1);
  }
  return candidate.toISOString();
}

function makeOccurrence(overrides: Partial<IOccurrence> = {}): IOccurrence {
  return {
    id: "occ-1",
    description: "Occurrence",
    startDate: occurrenceAtWorkingDayDistance(5),
    endDate: occurrenceAtWorkingDayDistance(5),
    ...overrides,
  };
}

function makeEvent(overrides: Partial<IEvent> = {}): IEvent {
  return {
    id: 1,
    name: "Test Event",
    objective: "",
    category: "generic",
    classification: "generic",
    status: "active",
    responsible: "generic",
    rules: [],
    occurrences: [makeOccurrence()],
    user: { id: "user-1", name: "Test User", picturePath: null, role: "editor" },
    ...overrides,
  };
}

const fakeRequest = { auth: { user: { id: "user-1", name: "Test User", picturePath: null, role: "editor" }, token: "t" } } as never;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  fakeEvents.list = [];
  fakeNotificationDb.records = [];
  fakeNotificationDb.reads = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NotificationService.listMine — generation", () => {
  it("generates a notification when an occurrence enters its lead-time window", async () => {
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ id: "occ-1", startDate: occurrenceAtWorkingDayDistance(5), endDate: occurrenceAtWorkingDayDistance(5) })],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ occurrenceId: "occ-1", eventId: 1, eventName: "Test Event", read: false });
  });

  it("does not generate when the occurrence is outside the lead-time window", async () => {
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ startDate: occurrenceBeyondWorkingDayDistance(5), endDate: occurrenceBeyondWorkingDayDistance(5) })],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(0);
  });

  it("does not generate when no lead time is configured on the event or occurrence", async () => {
    fakeEvents.list = [makeEvent({ notifyDaysBefore: undefined })];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(0);
  });

  it("prefers the occurrence-level override over the event-level default", async () => {
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 100,
        occurrences: [
          makeOccurrence({
            notifyDaysBeforeOverride: 5,
            startDate: occurrenceAtWorkingDayDistance(5),
            endDate: occurrenceAtWorkingDayDistance(5),
          }),
        ],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(1);
  });

  it("is idempotent across repeated calls", async () => {
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ startDate: occurrenceAtWorkingDayDistance(5), endDate: occurrenceAtWorkingDayDistance(5) })],
      }),
    ];

    const service = new NotificationService();
    await service.listMine(fakeRequest);
    await service.listMine(fakeRequest);

    expect(fakeNotificationDb.records).toHaveLength(1);
  });
});

describe("NotificationService.listMine — rescheduling", () => {
  it("regenerates when the occurrence's startDate changed and the new date is in-window", async () => {
    const occurrenceId = "occ-1";
    fakeNotificationDb.records = [
      {
        id: "notif-1",
        occurrenceId,
        occurrenceStartDateAtGen: occurrenceAtWorkingDayDistance(5),
        leadDaysAtGen: 5,
        createdAt: NOW.toISOString(),
      },
    ];
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [
          makeOccurrence({ id: occurrenceId, startDate: occurrenceAtWorkingDayDistance(3), endDate: occurrenceAtWorkingDayDistance(3) }),
        ],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(1);
    expect(fakeNotificationDb.records[0].id).not.toBe("notif-1");
    expect(fakeNotificationDb.records[0].occurrenceStartDateAtGen).toBe(occurrenceAtWorkingDayDistance(3));
  });

  it("does not regenerate when the new startDate is no longer within the lead-time window", async () => {
    const occurrenceId = "occ-1";
    fakeNotificationDb.records = [
      {
        id: "notif-1",
        occurrenceId,
        occurrenceStartDateAtGen: occurrenceAtWorkingDayDistance(5),
        leadDaysAtGen: 5,
        createdAt: NOW.toISOString(),
      },
    ];
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [
          makeOccurrence({
            id: occurrenceId,
            startDate: occurrenceBeyondWorkingDayDistance(5),
            endDate: occurrenceBeyondWorkingDayDistance(5),
          }),
        ],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(0);
    expect(fakeNotificationDb.records).toHaveLength(0);
  });

  it("regenerates when only the lead time changed and the occurrence is still in-window", async () => {
    const occurrenceId = "occ-1";
    const startDate = occurrenceAtWorkingDayDistance(5);
    fakeNotificationDb.records = [
      { id: "notif-1", occurrenceId, occurrenceStartDateAtGen: startDate, leadDaysAtGen: 1, createdAt: NOW.toISOString() },
    ];
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ id: occurrenceId, startDate, endDate: startDate })],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(1);
    expect(fakeNotificationDb.records[0].id).not.toBe("notif-1");
    expect(fakeNotificationDb.records[0].leadDaysAtGen).toBe(5);
  });

  it("removes a notification when the lead time changed such that the occurrence is no longer in-window", async () => {
    const occurrenceId = "occ-1";
    const startDate = occurrenceAtWorkingDayDistance(5);
    fakeNotificationDb.records = [
      { id: "notif-1", occurrenceId, occurrenceStartDateAtGen: startDate, leadDaysAtGen: 5, createdAt: NOW.toISOString() },
    ];
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 1,
        occurrences: [makeOccurrence({ id: occurrenceId, startDate, endDate: startDate })],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(0);
    expect(fakeNotificationDb.records).toHaveLength(0);
  });

  it("does not regenerate when neither the startDate nor the lead time changed", async () => {
    const occurrenceId = "occ-1";
    const startDate = occurrenceAtWorkingDayDistance(5);
    fakeNotificationDb.records = [
      { id: "notif-1", occurrenceId, occurrenceStartDateAtGen: startDate, leadDaysAtGen: 5, createdAt: NOW.toISOString() },
    ];
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ id: occurrenceId, startDate, endDate: startDate })],
      }),
    ];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(1);
    expect(fakeNotificationDb.records[0].id).toBe("notif-1");
  });

  it("prunes a notification whose occurrence no longer exists", async () => {
    fakeNotificationDb.records = [
      {
        id: "notif-1",
        occurrenceId: "deleted-occ",
        occurrenceStartDateAtGen: occurrenceAtWorkingDayDistance(5),
        leadDaysAtGen: 5,
        createdAt: NOW.toISOString(),
      },
    ];
    fakeEvents.list = [];

    const service = new NotificationService();
    const result = await service.listMine(fakeRequest);

    expect(result).toHaveLength(0);
    expect(fakeNotificationDb.records).toHaveLength(0);
  });
});

describe("NotificationService — read state", () => {
  it("marks a notification as read for the requesting user", async () => {
    fakeEvents.list = [
      makeEvent({
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ id: "occ-1", startDate: occurrenceAtWorkingDayDistance(5), endDate: occurrenceAtWorkingDayDistance(5) })],
      }),
    ];
    const service = new NotificationService();
    const [before] = await service.listMine(fakeRequest);

    await service.markRead(fakeRequest, before.id);
    const [after] = await service.listMine(fakeRequest);

    expect(after.read).toBe(true);
  });

  it("marks only currently-unread notifications on markAllRead", async () => {
    fakeEvents.list = [
      makeEvent({
        id: 1,
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ id: "occ-1", startDate: occurrenceAtWorkingDayDistance(5), endDate: occurrenceAtWorkingDayDistance(5) })],
      }),
      makeEvent({
        id: 2,
        notifyDaysBefore: 5,
        occurrences: [makeOccurrence({ id: "occ-2", startDate: occurrenceAtWorkingDayDistance(4), endDate: occurrenceAtWorkingDayDistance(4) })],
      }),
    ];
    const service = new NotificationService();
    await service.listMine(fakeRequest);

    await service.markAllRead(fakeRequest);
    const result = await service.listMine(fakeRequest);

    expect(result.every((n) => n.read)).toBe(true);
  });
});
