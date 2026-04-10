import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IEvent } from "@/features/calendar/interfaces";
import {
  buildCalendarSeed,
  type ICalendarDb,
} from "@/server/calendar/data/calendar.seed";

const CACHE_DIR = path.join(process.cwd(), "server", "calendar", "data", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "calendar-db.json");

const clone = <T>(value: T): T => structuredClone(value);

export class CalendarData {
  private writeQueue: Promise<void> = Promise.resolve();

  private async ensureCacheFile(): Promise<void> {
    await mkdir(CACHE_DIR, { recursive: true });

    try {
      await access(CACHE_FILE);
    } catch {
      const seed = buildCalendarSeed();
      await writeFile(CACHE_FILE, JSON.stringify(seed), "utf-8");
    }
  }

  private async readDb(): Promise<ICalendarDb> {
    await this.ensureCacheFile();
    const raw = await readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw) as ICalendarDb;
  }

  private async persistDb(nextDb: ICalendarDb): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await writeFile(CACHE_FILE, JSON.stringify(nextDb), "utf-8");
    });

    await this.writeQueue;
  }

  async listUsers() {
    const db = await this.readDb();
    return clone(db.users);
  }

  async listEvents() {
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



