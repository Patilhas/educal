import { Redis } from '@upstash/redis'
import type {
    ICategory,
    IClassification,
    IEvent,
    IHolidayPeriod,
    IResponsible,
  IStatus,
} from "@/shared/calendar/types";
import {
    buildCalendarSeed,
    type ICalendarDb,
} from "@/server/calendar/data/calendar.seed";
import { getAcademicYearRange } from "@/shared/calendar/academic-year";
import { CALENDAR_REDIS_DB_KEY } from "@/server/shared/config";

const clone = <T>(value: T): T => structuredClone(value);

const CACHE_REVALIDATE_MS = 500;

export class CalendarData {
    private writeQueue: Promise<void> = Promise.resolve();
    private cachedDb: ICalendarDb | null = null;
    private lastCacheValidationAt = 0;
    private redis = Redis.fromEnv()

    private async ensureCacheFile(): Promise<void> {
        const raw = await this.redis.get(CALENDAR_REDIS_DB_KEY) as ICalendarDb | null;

        if (!raw) {
            const seed = buildCalendarSeed();
            await this.redis.set(CALENDAR_REDIS_DB_KEY, JSON.stringify(seed));
            this.cachedDb = null;
        }
    }

    private async readDb(): Promise<ICalendarDb> {
        await this.ensureCacheFile();

        // If this process is currently writing, wait so reads never see partial state.
        await this.writeQueue;

        const now = Date.now();
        if (
            this.cachedDb &&
            now - this.lastCacheValidationAt < CACHE_REVALIDATE_MS
        ) {
            return this.cachedDb;
        }

        const parsed = (await this.redis.get(CALENDAR_REDIS_DB_KEY)) as ICalendarDb;
        if (!parsed) throw new Error(`${CALENDAR_REDIS_DB_KEY} not found in Redis after ensureCacheFile`);

        this.cachedDb = parsed;
        this.lastCacheValidationAt = now;

        return parsed;
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

    async listEvents(): Promise<IEvent[]> {
        const db = await this.readDb();
        return clone(db.academicYears.flatMap((ay) => ay.events));
    }

    async findEventById(eventId: number) {
        const db = await this.readDb();
        for (const ay of db.academicYears) {
            const found = ay.events.find((event) => event.id === eventId);
            if (found) return clone(found);
        }
        return null;
    }

    async insertEventIntoAcademicYear(event: IEvent, academicYearStart?: number): Promise<IEvent> {
        let result!: IEvent;

        this.writeQueue = this.writeQueue.then(async () => {
            // Fresh read inside the queue — guaranteed to see all previous writes.
            const db = (await this.redis.get(CALENDAR_REDIS_DB_KEY)) as ICalendarDb;

            const assignedId =
                event.id > 0
                    ? event.id
                    : (() => {
                          const allIds = db.academicYears.flatMap((ay) => ay.events.map((e) => e.id));
                          return allIds.length === 0 ? 1 : Math.max(...allIds) + 1;
                      })();

            const finalEvent: IEvent = { ...event, id: assignedId };

            const eventYear =
                typeof academicYearStart === "number"
                    ? academicYearStart
                    : new Date(finalEvent.occurrences[0]?.startDate ?? new Date().toISOString()).getFullYear();

            const ayIndex = db.academicYears.findIndex((ay) => ay.startYear === eventYear);

            let nextDb: ICalendarDb;
            if (ayIndex >= 0) {
                const nextAcademicYears = [...db.academicYears];
                nextAcademicYears[ayIndex] = {
                    ...nextAcademicYears[ayIndex],
                    events: [finalEvent, ...nextAcademicYears[ayIndex].events],
                };
                nextDb = { ...db, academicYears: nextAcademicYears };
            } else {
                const range = getAcademicYearRange(eventYear);
                nextDb = {
                    ...db,
                    academicYears: [{ ...range, holidays: [], events: [finalEvent] }, ...db.academicYears],
                };
            }

            await this.redis.set(CALENDAR_REDIS_DB_KEY, JSON.stringify(nextDb));
            this.cachedDb = clone(nextDb);
            this.lastCacheValidationAt = Date.now();
            result = clone(finalEvent);
        });

        await this.writeQueue;
        return result;
    }

    async replaceEvent(eventId: number, event: IEvent) {
        const db = await this.readDb();

        for (let i = 0; i < db.academicYears.length; i++) {
            const ay = db.academicYears[i];
            const idx = ay.events.findIndex((item) => item.id === eventId);
            if (idx >= 0) {
                const nextAcademicYears = [...db.academicYears];
                const nextEvents = [...ay.events];
                nextEvents[idx] = event;
                nextAcademicYears[i] = { ...ay, events: nextEvents };

                await this.persistDb({ ...db, academicYears: nextAcademicYears });
                return clone(event);
            }
        }

        return null;
    }

    async deleteEvent(eventId: number) {
        const db = await this.readDb();

        let found = false;
        const nextAcademicYears = db.academicYears.map((ay) => {
            const filtered = ay.events.filter((e) => e.id !== eventId);
            if (filtered.length !== ay.events.length) found = true;
            return { ...ay, events: filtered };
        });

        if (!found) return false;

        await this.persistDb({ ...db, academicYears: nextAcademicYears });
        return true;
    }

    // ─── Holidays ──────────────────────────────────────────────────────────────

    async listAllHolidays(): Promise<Record<number, IHolidayPeriod[]>> {
        const db = await this.readDb();
        return Object.fromEntries(
            db.academicYears.map((ay) => [ay.startYear, clone(ay.holidays ?? [])]),
        );
    }

    async listHolidays(academicYearStart: number): Promise<IHolidayPeriod[]> {
        const db = await this.readDb();
        const ay = db.academicYears.find((a) => a.startYear === academicYearStart);
        return clone(ay?.holidays ?? []);
    }

    async upsertHoliday(academicYearStart: number, holiday: IHolidayPeriod): Promise<IHolidayPeriod> {
        const db = await this.readDb();
        const ayIndex = db.academicYears.findIndex((a) => a.startYear === academicYearStart);

        let nextAcademicYears;
        if (ayIndex >= 0) {
            const ay = db.academicYears[ayIndex];
            const existing = (ay.holidays ?? []).findIndex((h) => h.id === holiday.id);
            const nextHolidays = existing >= 0
                ? (ay.holidays ?? []).map((h, i) => (i === existing ? holiday : h))
                : [...(ay.holidays ?? []), holiday];
            nextAcademicYears = [...db.academicYears];
            nextAcademicYears[ayIndex] = { ...ay, holidays: nextHolidays };
        } else {
            const range = getAcademicYearRange(academicYearStart);
            nextAcademicYears = [{ ...range, holidays: [holiday], events: [] }, ...db.academicYears];
        }

        await this.persistDb({ ...db, academicYears: nextAcademicYears });
        return clone(holiday);
    }

    async deleteHoliday(academicYearStart: number, holidayId: string): Promise<boolean> {
        const db = await this.readDb();
        const ayIndex = db.academicYears.findIndex((a) => a.startYear === academicYearStart);
        if (ayIndex < 0) return false;

        const ay = db.academicYears[ayIndex];
        const filtered = (ay.holidays ?? []).filter((h) => h.id !== holidayId);
        if (filtered.length === (ay.holidays ?? []).length) return false;

        const nextAcademicYears = [...db.academicYears];
        nextAcademicYears[ayIndex] = { ...ay, holidays: filtered };
        await this.persistDb({ ...db, academicYears: nextAcademicYears });
        return true;
    }

    private async persistDb(nextDb: ICalendarDb): Promise<void> {
        this.writeQueue = this.writeQueue.then(async () => {
            await this.redis.set(CALENDAR_REDIS_DB_KEY, JSON.stringify(nextDb));

            this.cachedDb = clone(nextDb);
            this.lastCacheValidationAt = Date.now();
        });

        await this.writeQueue;
    }
}

export const calendarData = new CalendarData();
