import type {
  ICategory,
  IClassification,
  IEvent,
  IVacationPeriod,
  IResponsible,
  IStatus,
} from "@/shared/calendar/types";
import type { ICalendarDb } from "@/server/calendar/data/calendar.seed";
import { getAcademicYearRange } from "@/shared/calendar/academic-year";
import { CALENDAR_REDIS_DB_KEY } from "@/server/shared/config";
import type { ICalendarRepository } from "@/server/calendar/data/calendar.repository";
import { RedisDbStore, clone } from "@/server/shared/data/redis-store";

export class CalendarRepositoryRedis extends RedisDbStore<ICalendarDb> implements ICalendarRepository {
  constructor() {
    super(CALENDAR_REDIS_DB_KEY, (raw) => {
      if (!raw) {
        throw new Error(
          `${CALENDAR_REDIS_DB_KEY} not found in Redis. Run \`pnpm run db:seed -- --target=redis\` first.`,
        );
      }
      return raw;
    });
  }

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

  async listEvents(): Promise<IEvent[]> {
    const db = await this.readDb();
    return clone(db.academicYears.flatMap((ay) => ay.events));
  }

  async findEventById(eventId: number): Promise<IEvent | null> {
    const db = await this.readDb();
    for (const ay of db.academicYears) {
      const found = ay.events.find((event) => event.id === eventId);
      if (found) return clone(found);
    }
    return null;
  }

  async insertEventIntoAcademicYear(event: IEvent, academicYearStart?: number): Promise<IEvent> {
    return this.persistDbWithResult((db) => {
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
          academicYears: [{ ...range, vacations: [], events: [finalEvent] }, ...db.academicYears],
        };
      }

      return { db: nextDb, result: clone(finalEvent) };
    });
  }

  async replaceEvent(eventId: number, event: IEvent): Promise<IEvent | null> {
    return this.persistDbWithResult((db) => {
      for (let i = 0; i < db.academicYears.length; i++) {
        const ay = db.academicYears[i];
        const idx = ay.events.findIndex((item) => item.id === eventId);
        if (idx >= 0) {
          const nextAcademicYears = [...db.academicYears];
          const nextEvents = [...ay.events];
          nextEvents[idx] = event;
          nextAcademicYears[i] = { ...ay, events: nextEvents };
          return { db: { ...db, academicYears: nextAcademicYears }, result: clone(event) };
        }
      }
      return { db, result: null };
    });
  }

  async deleteEvent(eventId: number): Promise<boolean> {
    return this.persistDbWithResult((db) => {
      let found = false;
      const nextAcademicYears = db.academicYears.map((ay) => {
        const filtered = ay.events.filter((e) => e.id !== eventId);
        if (filtered.length !== ay.events.length) found = true;
        return { ...ay, events: filtered };
      });
      return found ? { db: { ...db, academicYears: nextAcademicYears }, result: true } : { db, result: false };
    });
  }

  async listAllVacations(): Promise<Record<number, IVacationPeriod[]>> {
    const db = await this.readDb();
    return Object.fromEntries(
      db.academicYears.map((ay) => [ay.startYear, clone(ay.vacations ?? [])]),
    );
  }

  async listVacations(academicYearStart: number): Promise<IVacationPeriod[]> {
    const db = await this.readDb();
    const ay = db.academicYears.find((a) => a.startYear === academicYearStart);
    return clone(ay?.vacations ?? []);
  }

  async upsertVacation(academicYearStart: number, vacation: IVacationPeriod): Promise<IVacationPeriod> {
    await this.persistDb((db) => {
      const ayIndex = db.academicYears.findIndex((a) => a.startYear === academicYearStart);
      let nextAcademicYears;
      if (ayIndex >= 0) {
        const ay = db.academicYears[ayIndex];
        const existing = (ay.vacations ?? []).findIndex((v) => v.id === vacation.id);
        const nextVacations =
          existing >= 0
            ? (ay.vacations ?? []).map((v, i) => (i === existing ? vacation : v))
            : [...(ay.vacations ?? []), vacation];
        nextAcademicYears = [...db.academicYears];
        nextAcademicYears[ayIndex] = { ...ay, vacations: nextVacations };
      } else {
        const range = getAcademicYearRange(academicYearStart);
        nextAcademicYears = [{ ...range, vacations: [vacation], events: [] }, ...db.academicYears];
      }
      return { ...db, academicYears: nextAcademicYears };
    });
    return clone(vacation);
  }

  async deleteVacation(academicYearStart: number, vacationId: string): Promise<boolean> {
    return this.persistDbWithResult((db) => {
      const ayIndex = db.academicYears.findIndex((a) => a.startYear === academicYearStart);
      if (ayIndex < 0) return { db, result: false };

      const ay = db.academicYears[ayIndex];
      const filtered = (ay.vacations ?? []).filter((v) => v.id !== vacationId);
      if (filtered.length === (ay.vacations ?? []).length) return { db, result: false };

      const nextAcademicYears = [...db.academicYears];
      nextAcademicYears[ayIndex] = { ...ay, vacations: filtered };
      return { db: { ...db, academicYears: nextAcademicYears }, result: true };
    });
  }
}
