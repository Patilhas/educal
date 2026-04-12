import type {
  ICategory,
  IClassification,
  IEvent,
  IResponsible,
  IStatus,
  IUser,
} from "@/features/calendar/interfaces";
import {
  buildCalendarSeed,
  type ICalendarDb,
} from "@/server/calendar/data/calendar.seed";

const clone = <T>(value: T): T => structuredClone(value);

const globalForDb = globalThis as unknown as {
  calendarDb: ICalendarDb | undefined;
};

export class CalendarData {
  private async readDb(): Promise<ICalendarDb> {
    if (!globalForDb.calendarDb) {
      globalForDb.calendarDb = buildCalendarSeed();
    }
    return globalForDb.calendarDb;
  }

  private async persistDb(nextDb: ICalendarDb): Promise<void> {
    globalForDb.calendarDb = clone(nextDb);
  }

  // ─── Reference data ────────────────────────────────────────────────────────

  async listCategories(): Promise<ICategory[]> {
    const db = await this.readDb();
    return clone(db.categories);
  }

  async listClassifications(): Promise<IClassification[]> {
    const db = await this.readDb();
    return clone(db.classifications);
  }

  async listStatuses(): Promise<IStatus[]> {
    const db = await this.readDb();
    return clone(db.statuses);
  }

  async listResponsibles(): Promise<IResponsible[]> {
    const db = await this.readDb();
    return clone(db.responsibles);
  }

  // ─── Core data ─────────────────────────────────────────────────────────────

  async listUsers(): Promise<IUser[]> {
    const db = await this.readDb();
    return clone(db.users);
  }

  async listEvents(): Promise<IEvent[]> {
    const db = await this.readDb();
    return clone(db.events);
  }

  async findEventById(eventId: number) {
    const db = await this.readDb();
    return db.events.find((event) => event.id === eventId) ?? null;
  }

  async insertEvent(event: IEvent) {
    const db = await this.readDb();
    const nextDb: ICalendarDb = {
      ...db,
      events: [event, ...db.events],
    };

    await this.persistDb(nextDb);
    return clone(event);
  }

  async replaceEvent(eventId: number, event: IEvent) {
    const db = await this.readDb();
    const index = db.events.findIndex((item) => item.id === eventId);
    if (index < 0) {
      return null;
    }

    const nextEvents = [...db.events];
    nextEvents[index] = event;

    await this.persistDb({
      ...db,
      events: nextEvents,
    });

    return clone(event);
  }

  async deleteEvent(eventId: number) {
    const db = await this.readDb();
    const hasEvent = db.events.some((event) => event.id === eventId);
    if (!hasEvent) {
      return false;
    }

    await this.persistDb({
      ...db,
      events: db.events.filter((event) => event.id !== eventId),
    });

    return true;
  }
}

export const calendarData = new CalendarData();
