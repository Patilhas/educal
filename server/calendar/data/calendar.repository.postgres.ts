import { and, eq, sql } from "drizzle-orm";
import { db, type DbTransaction } from "@/db/client";
import {
  academicYears,
  categories,
  classifications,
  events,
  eventOccurrences,
  eventRules,
  responsibles,
  statuses,
  vacationPeriods,
} from "@/db/schema/calendar.schema";
import { users } from "@/db/schema/auth.schema";
import { getAcademicYearRange } from "@/shared/calendar/academic-year";
import type {
  ICategory,
  IClassification,
  IEvent,
  IEventRule,
  IOccurrence,
  IVacationPeriod,
  IResponsible,
  IStatus,
} from "@/shared/calendar/types";
import type { ICalendarRepository } from "@/server/calendar/data/calendar.repository";

type EventRow = typeof events.$inferSelect;
type UserRow = typeof users.$inferSelect;
type OccurrenceRow = typeof eventOccurrences.$inferSelect;
type RuleRow = typeof eventRules.$inferSelect;
type EventWithRelations = EventRow & {
  user: UserRow;
  occurrences: OccurrenceRow[];
  rules: RuleRow[];
};

function toDomainEvent(row: EventWithRelations): IEvent {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    category: row.category,
    classification: row.classification,
    status: row.status,
    responsible: row.responsible,
    notifyDaysBefore: row.notifyDaysBefore ?? undefined,
    rules: row.rules.map((r): IEventRule => ({ type: r.type, config: r.config })),
    occurrences: row.occurrences
      .slice()
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map(
        (o): IOccurrence => ({
          id: o.id,
          description: o.description,
          startDate: o.startDate.toISOString(),
          endDate: o.endDate.toISOString(),
          minDays: o.minDays ?? undefined,
          minDaysToNext: o.minDaysToNext ?? undefined,
          notifyDaysBeforeOverride: o.notifyDaysBeforeOverride ?? undefined,
        }),
      ),
    user: {
      id: row.user.id,
      name: row.user.name,
      picturePath: row.user.picturePath,
      role: row.user.role,
    },
  };
}

function toDomainVacation(row: typeof vacationPeriods.$inferSelect): IVacationPeriod {
  return {
    id: row.id,
    label: row.label,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
  };
}

export class CalendarRepositoryPostgres implements ICalendarRepository {
  async listCategories(): Promise<ICategory[]> {
    return db.select().from(categories);
  }

  async listClassifications(): Promise<IClassification[]> {
    return db.select().from(classifications);
  }

  async listStatuses(): Promise<IStatus[]> {
    return db.select().from(statuses);
  }

  async listResponsibles(): Promise<IResponsible[]> {
    return db.select().from(responsibles);
  }

  async listEvents(): Promise<IEvent[]> {
    const rows = await db.query.events.findMany({
      with: { user: true, occurrences: true, rules: true },
    });
    return rows.map(toDomainEvent);
  }

  async findEventById(eventId: number): Promise<IEvent | null> {
    const row = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: { user: true, occurrences: true, rules: true },
    });
    return row ? toDomainEvent(row) : null;
  }

  async insertEventIntoAcademicYear(event: IEvent, academicYearStart?: number): Promise<IEvent> {
    const eventYear =
      academicYearStart ??
      new Date(event.occurrences[0]?.startDate ?? new Date().toISOString()).getFullYear();

    return db.transaction(async (tx) => {
      await this.ensureAcademicYear(tx, eventYear);

      const assignedId = event.id > 0 ? event.id : await this.nextEventId(tx);

      await tx.insert(events).values({
        id: assignedId,
        academicYearStart: eventYear,
        name: event.name,
        objective: event.objective,
        category: event.category,
        classification: event.classification,
        status: event.status,
        responsible: event.responsible,
        notifyDaysBefore: event.notifyDaysBefore ?? null,
        userId: event.user.id,
      });

      await this.insertOccurrencesAndRules(tx, assignedId, event.occurrences, event.rules);

      return this.loadEvent(tx, assignedId);
    });
  }

  async replaceEvent(eventId: number, event: IEvent): Promise<IEvent | null> {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(events)
        .set({
          name: event.name,
          objective: event.objective,
          category: event.category,
          classification: event.classification,
          status: event.status,
          responsible: event.responsible,
          notifyDaysBefore: event.notifyDaysBefore ?? null,
          userId: event.user.id,
        })
        .where(eq(events.id, eventId))
        .returning({ id: events.id });

      if (!updated) return null;

      await tx.delete(eventOccurrences).where(eq(eventOccurrences.eventId, eventId));
      await tx.delete(eventRules).where(eq(eventRules.eventId, eventId));
      await this.insertOccurrencesAndRules(tx, eventId, event.occurrences, event.rules);

      return this.loadEvent(tx, eventId);
    });
  }

  async deleteEvent(eventId: number): Promise<boolean> {
    const deleted = await db.delete(events).where(eq(events.id, eventId)).returning({ id: events.id });
    return deleted.length > 0;
  }

  async listAllVacations(): Promise<Record<number, IVacationPeriod[]>> {
    const rows = await db.select().from(vacationPeriods);
    const result: Record<number, IVacationPeriod[]> = {};
    for (const row of rows) {
      const list = result[row.academicYearStart] ?? (result[row.academicYearStart] = []);
      list.push(toDomainVacation(row));
    }
    return result;
  }

  async listVacations(academicYearStart: number): Promise<IVacationPeriod[]> {
    const rows = await db
      .select()
      .from(vacationPeriods)
      .where(eq(vacationPeriods.academicYearStart, academicYearStart));
    return rows.map(toDomainVacation);
  }

  async upsertVacation(academicYearStart: number, vacation: IVacationPeriod): Promise<IVacationPeriod> {
    return db.transaction(async (tx) => {
      await this.ensureAcademicYear(tx, academicYearStart);

      const [row] = await tx
        .insert(vacationPeriods)
        .values({
          id: vacation.id,
          academicYearStart,
          label: vacation.label,
          startDate: new Date(vacation.startDate),
          endDate: new Date(vacation.endDate),
        })
        .onConflictDoUpdate({
          target: vacationPeriods.id,
          set: {
            label: vacation.label,
            startDate: new Date(vacation.startDate),
            endDate: new Date(vacation.endDate),
          },
        })
        .returning();

      return toDomainVacation(row);
    });
  }

  async deleteVacation(academicYearStart: number, vacationId: string): Promise<boolean> {
    const deleted = await db
      .delete(vacationPeriods)
      .where(and(eq(vacationPeriods.id, vacationId), eq(vacationPeriods.academicYearStart, academicYearStart)))
      .returning({ id: vacationPeriods.id });
    return deleted.length > 0;
  }

  private async ensureAcademicYear(tx: DbTransaction, year: number): Promise<void> {
    const range = getAcademicYearRange(year);
    await tx
      .insert(academicYears)
      .values({
        startYear: range.startYear,
        label: range.label,
        startDate: new Date(range.startDate),
        endDate: new Date(range.endDate),
      })
      .onConflictDoNothing();
  }

  private async nextEventId(tx: DbTransaction): Promise<number> {
    const [row] = await tx.select({ maxId: sql<number>`coalesce(max(${events.id}), 0)` }).from(events);
    return (row?.maxId ?? 0) + 1;
  }

  private async insertOccurrencesAndRules(
    tx: DbTransaction,
    eventId: number,
    occurrences: IOccurrence[],
    rules: IEventRule[],
  ): Promise<void> {
    if (occurrences.length > 0) {
      await tx.insert(eventOccurrences).values(
        occurrences.map((o) => ({
          id: o.id,
          eventId,
          description: o.description,
          startDate: new Date(o.startDate),
          endDate: new Date(o.endDate),
          minDays: o.minDays ?? null,
          minDaysToNext: o.minDaysToNext ?? null,
          notifyDaysBeforeOverride: o.notifyDaysBeforeOverride ?? null,
        })),
      );
    }
    if (rules.length > 0) {
      await tx.insert(eventRules).values(
        rules.map((r) => ({ eventId, type: r.type, config: r.config })),
      );
    }
  }

  private async loadEvent(tx: DbTransaction, eventId: number): Promise<IEvent> {
    const row = await tx.query.events.findFirst({
      where: eq(events.id, eventId),
      with: { user: true, occurrences: true, rules: true },
    });
    if (!row) throw new Error(`Event ${eventId} not found after write`);
    return toDomainEvent(row);
  }
}
