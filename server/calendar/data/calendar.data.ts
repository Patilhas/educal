import { Redis } from '@upstash/redis'
import type {
    ICategory,
    IClassification,
    IEvent,
    IResponsible,
  IStatus,
} from "@/shared/calendar/types";
import {
    buildCalendarSeed,
    type ICalendarDb,
} from "@/server/calendar/data/calendar.seed";
import { CALENDAR_REDIS_DB_KEY } from "@/server/shared/config";

const clone = <T>(value: T): T => structuredClone(value);

const CACHE_REVALIDATE_MS = 500;

export class CalendarData {
    private writeQueue: Promise<void> = Promise.resolve();
    private cachedDb: ICalendarDb | null = null;
    private lastCacheValidationAt = 0;
    private redis = Redis.fromEnv()

    private async ensureCacheFile(): Promise<void> {
        const cacheFile = await this.redis.get(CALENDAR_REDIS_DB_KEY);

        if (!cacheFile) {
            const seed = buildCalendarSeed();
            await this.redis.set(CALENDAR_REDIS_DB_KEY, JSON.stringify(seed));
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

    private async persistDb(nextDb: ICalendarDb): Promise<void> {
        this.writeQueue = this.writeQueue.then(async () => {
            await this.redis.set(CALENDAR_REDIS_DB_KEY, JSON.stringify(nextDb));

            this.cachedDb = clone(nextDb);
            this.lastCacheValidationAt = Date.now();
        });

        await this.writeQueue;
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

    async insertEventIntoAcademicYear(event: IEvent, academicYearStart?: number) {
        const db = await this.readDb();

        const eventYear =
            typeof academicYearStart === "number"
                ? academicYearStart
                : new Date(event.occurrences[0]?.startDate ?? new Date().toISOString()).getFullYear();

        // find existing academic year
        const ayIndex = db.academicYears.findIndex((ay) => ay.startYear === eventYear);

        let nextDb: ICalendarDb;
        if (ayIndex >= 0) {
            const nextAcademicYears = [...db.academicYears];
            nextAcademicYears[ayIndex] = {
                ...nextAcademicYears[ayIndex],
                events: [event, ...nextAcademicYears[ayIndex].events],
            };

            nextDb = {
                ...db,
                academicYears: nextAcademicYears,
            };
        } else {
            // create new academic year range
            const startDate = new Date(eventYear, 0, 1, 0, 0, 0, 0).toISOString();
            const endDate = new Date(eventYear + 1, 8, 30, 23, 59, 59, 999).toISOString();
            const newAcademicYear = {
                startYear: eventYear,
                label: `${eventYear}/${eventYear + 1}`,
                startDate,
                endDate,
                events: [event],
            };

            nextDb = {
                ...db,
                academicYears: [newAcademicYear, ...db.academicYears],
            };
        }

        await this.persistDb(nextDb);
        return clone(event);
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
}

export const calendarData = new CalendarData();