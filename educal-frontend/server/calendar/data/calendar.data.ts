import { Redis } from '@upstash/redis'
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

const REDIS_KEY = process.env.UPSTASH_REDIS_FILE_NAME || 'calendar-db';
const CACHE_REVALIDATE_MS = 500;

export class CalendarData {
    private writeQueue: Promise<void> = Promise.resolve();
    private cachedDb: ICalendarDb | null = null;
    private lastCacheValidationAt = 0;
    private redis = Redis.fromEnv()

    private async ensureCacheFile(): Promise<void> {
        const cacheFile = await this.redis.get(REDIS_KEY);

        if (!cacheFile) {
            const seed = buildCalendarSeed();
            await this.redis.set(REDIS_KEY, JSON.stringify(seed));
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

        const parsed = await this.redis.get(REDIS_KEY) as ICalendarDb;
        if (!parsed) throw new Error(`${REDIS_KEY} not found in Redis after ensureCacheFile`);

        this.cachedDb = parsed;
        this.lastCacheValidationAt = now;

        return parsed;
    }

    private async persistDb(nextDb: ICalendarDb): Promise<void> {
        this.writeQueue = this.writeQueue.then(async () => {
            await this.redis.set(REDIS_KEY, JSON.stringify(nextDb));

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