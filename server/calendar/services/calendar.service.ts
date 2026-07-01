import { z } from "zod";
import { canManageCalendarEvents } from "@/shared/user/roles";
import { getAcademicYearRange, getEventAcademicYearStart, shiftDateByYears } from "@/shared/calendar/academic-year";
import { validateEventRule, getRulesMetadata, minDurationRule, minDaysToNextRule } from "@/server/calendar/rules";
import type {
  IAcademicYearMigrationResult,
  IAcademicYearValidationResult,
  ICalendarRuleIssue,
  IEvent,
  IVacationPeriod,
  IOccurrence,
} from "@/shared/calendar/types";
import type { IUser } from "@/shared/user/types";
import {
  buildEventPayloadSchema,
  vacationPayloadSchema,
  patchOccurrenceSchema,
} from "@/server/calendar/schemas";
import { calendarData } from "@/server/calendar/data/calendar.data";
import type { IRequestWithAuth } from "@/server/auth/session";
import { DomainError } from "@/server/shared/domain-error";

const toIsoString = (dateValue: string) => new Date(dateValue).toISOString();

export class CalendarService {
  async listEvents(): Promise<IEvent[]> {
    return calendarData.listEvents();
  }

  async listEnums() {
    const [categories, classifications, statuses, responsibles] =
      await Promise.all([
        calendarData.listCategories(),
        calendarData.listClassifications(),
        calendarData.listStatuses(),
        calendarData.listResponsibles(),
      ]);

    return {
      categories,
      classifications: classifications.map((c) => c.value),
      statuses: statuses.map((s) => s.name),
      responsibles: responsibles.map((r) => r.value),
      rules: getRulesMetadata(),
    };
  }

  async createEvent(request: IRequestWithAuth, payload: unknown): Promise<IEvent> {
    this.ensureCanManageEvents(request.auth.user.role);
    const schema = await buildEventPayloadSchema();
    const parsed = schema.parse(payload);
    const academicYearStart =
      parsed.academicYearStart ?? new Date(parsed.occurrences[0].startDate).getFullYear();

    const newEvent: IEvent = {
      id: 0,
      name: parsed.name,
      objective: parsed.objective,
      category: parsed.category,
      classification: parsed.classification,
      status: parsed.status,
      responsible: parsed.responsible,
      rules: parsed.rules,
      occurrences: parsed.occurrences.map((occurrence) => ({
        id: occurrence.id,
        description: occurrence.description,
        startDate: toIsoString(occurrence.startDate),
        endDate: toIsoString(occurrence.endDate),
        minDays: occurrence.minDays,
        minDaysToNext: occurrence.minDaysToNext,
      })),
      user: request.auth.user,
    };

    return calendarData.insertEventIntoAcademicYear(newEvent, academicYearStart);
  }

  async updateEvent(request: IRequestWithAuth, eventId: number, payload: unknown): Promise<IEvent> {
    this.ensureCanManageEvents(request.auth.user.role);
    const schema = await buildEventPayloadSchema();
    const parsed = schema.extend({ id: z.number().int().positive().optional() }).parse(payload);

    if (parsed.id && parsed.id !== eventId) {
      throw new DomainError("CONFLICT", 409, "O id no corpo não coincide com o da rota");
    }

    const existing = await calendarData.findEventById(eventId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    const targetAcademicYearStart =
      parsed.academicYearStart ?? new Date(parsed.occurrences[0].startDate).getFullYear();

    const updatedEvent: IEvent = {
      id: eventId,
      name: parsed.name,
      objective: parsed.objective,
      category: parsed.category,
      classification: parsed.classification,
      status: parsed.status,
      responsible: parsed.responsible,
      rules: parsed.rules,
      occurrences: parsed.occurrences.map((occurrence) => ({
        id: occurrence.id,
        description: occurrence.description,
        startDate: toIsoString(occurrence.startDate),
        endDate: toIsoString(occurrence.endDate),
        minDays: occurrence.minDays,
        minDaysToNext: occurrence.minDaysToNext,
      })),
      user: existing.user,
    };

    // If academic year changed, remove from old and insert into new academic year
    const existingAcademicYearStart = getEventAcademicYearStart({ occurrences: existing.occurrences });
    if (existingAcademicYearStart !== targetAcademicYearStart) {
      // delete existing event and insert into target year
      const deleted = await calendarData.deleteEvent(eventId);
      if (!deleted) throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");

      const inserted = await calendarData.insertEventIntoAcademicYear(updatedEvent, targetAcademicYearStart);
      return inserted as IEvent;
    }

    const saved = await calendarData.replaceEvent(eventId, updatedEvent);
    if (!saved) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    return saved;
  }

  async validateAcademicYear(academicYearStart: number): Promise<IAcademicYearValidationResult> {
    const academicYear = getAcademicYearRange(academicYearStart);
    const [events, vacations] = await Promise.all([
      calendarData.listEvents(),
      calendarData.listVacations(academicYearStart),
    ]);
    const academicYearEvents = events.filter(
      (event) => getEventAcademicYearStart(event) === academicYearStart,
    );

    const issues = academicYearEvents.flatMap((event) =>
      this.collectEventRuleIssues(event, academicYearStart, events, vacations),
    );

    return {
      academicYear,
      totalEvents: academicYearEvents.length,
      totalOccurrences: academicYearEvents.reduce(
        (count, event) => count + event.occurrences.length,
        0,
      ),
      issues,
    };
  }

  async migrateAcademicYear(
    request: IRequestWithAuth,
    sourceAcademicYearStart: number,
  ): Promise<IAcademicYearMigrationResult> {
    this.ensureCanManageEvents(request.auth.user.role);

    const targetAcademicYearStart = sourceAcademicYearStart + 1;

    // Vacations migration
    const sourceVacations = await calendarData.listVacations(sourceAcademicYearStart);
    const targetVacations = await calendarData.listVacations(targetAcademicYearStart);
    const targetLabels = new Set(targetVacations.map((v) => v.label));
    let createdVacations = 0;
    let skippedVacations = 0;

    for (const v of sourceVacations) {
      if (targetLabels.has(v.label)) {
        skippedVacations++;
        continue;
      }
      await calendarData.upsertVacation(targetAcademicYearStart, {
        id: crypto.randomUUID(),
        label: v.label,
        startDate: shiftDateByYears(v.startDate, 1),
        endDate: shiftDateByYears(v.endDate, 1),
      });
      createdVacations++;
    }

    // Events Migration
    const allEvents = await calendarData.listEvents();

    const sourceEvents = allEvents.filter(
      (event) => getEventAcademicYearStart({ occurrences: event.occurrences }) === sourceAcademicYearStart,
    );
    const targetEvents = allEvents.filter(
      (event) => getEventAcademicYearStart({ occurrences: event.occurrences }) === targetAcademicYearStart,
    );

    const existingSignatures = new Set(
      targetEvents.map((event) => this.buildEventSignature(event)),
    );

    const issues: ICalendarRuleIssue[] = [];
    let createdEvents = 0;
    let skippedEvents = 0;

    for (const sourceEvent of sourceEvents) {
      const migratedEvent = this.cloneEventForAcademicYear(sourceEvent, targetAcademicYearStart);
      const signature = this.buildEventSignature(migratedEvent);

      if (existingSignatures.has(signature)) {
        skippedEvents += 1;
        continue;
      }

      const saved = await calendarData.insertEventIntoAcademicYear(migratedEvent, targetAcademicYearStart);
      existingSignatures.add(signature);
      createdEvents += 1;
      issues.push(...this.collectEventRuleIssues(saved, targetAcademicYearStart, allEvents, targetVacations));
    }

    return {
      sourceAcademicYear: getAcademicYearRange(sourceAcademicYearStart),
      targetAcademicYear: getAcademicYearRange(targetAcademicYearStart),
      createdEvents,
      skippedEvents,
      createdVacations,
      skippedVacations,
      issues,
    };
  }

  async listAllVacations(): Promise<Record<number, IVacationPeriod[]>> {
    return calendarData.listAllVacations();
  }

  async createVacation(
    request: IRequestWithAuth,
    academicYearStart: number,
    payload: unknown,
  ): Promise<IVacationPeriod> {
    this.ensureCanManageEvents(request.auth.user.role);
    const parsed = vacationPayloadSchema.parse(payload);
    return calendarData.upsertVacation(academicYearStart, {
      id: crypto.randomUUID(),
      label: parsed.label,
      startDate: new Date(parsed.startDate).toISOString(),
      endDate: new Date(parsed.endDate).toISOString(),
    });
  }

  async updateVacation(
    request: IRequestWithAuth,
    academicYearStart: number,
    vacationId: string,
    payload: unknown,
  ): Promise<IVacationPeriod> {
    this.ensureCanManageEvents(request.auth.user.role);
    const parsed = vacationPayloadSchema.parse(payload);
    return calendarData.upsertVacation(academicYearStart, {
      id: vacationId,
      label: parsed.label,
      startDate: new Date(parsed.startDate).toISOString(),
      endDate: new Date(parsed.endDate).toISOString(),
    });
  }

  async deleteVacation(
    request: IRequestWithAuth,
    academicYearStart: number,
    vacationId: string,
  ): Promise<void> {
    this.ensureCanManageEvents(request.auth.user.role);
    const removed = await calendarData.deleteVacation(academicYearStart, vacationId);
    if (!removed) {
      throw new DomainError("NOT_FOUND", 404, "Período de férias não encontrado");
    }
  }

  async deleteEvent(request: IRequestWithAuth, eventId: number): Promise<void> {
    this.ensureCanManageEvents(request.auth.user.role);
    const removed = await calendarData.deleteEvent(eventId);
    if (!removed) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }
  }

  async updateOccurrence(
    request: IRequestWithAuth,
    eventId: number,
    occurrenceId: string,
    payload: unknown,
  ): Promise<IEvent> {
    this.ensureCanManageEvents(request.auth.user.role);
    const parsed = patchOccurrenceSchema.parse(payload);

    if (!parsed.startDate && !parsed.endDate && !parsed.description) {
      throw new DomainError(
        "VALIDATION_ERROR",
        400,
        "Informe pelo menos um campo para atualizar a ocorrência",
      );
    }

    const existing = await calendarData.findEventById(eventId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    const occurrence = existing.occurrences.find((item: IOccurrence) => item.id === occurrenceId);
    if (!occurrence) {
      throw new DomainError("NOT_FOUND", 404, "Ocorrência não encontrada");
    }

    const nextOccurrence: IOccurrence = {
      ...occurrence,
      description: parsed.description ?? occurrence.description,
      startDate: toIsoString(parsed.startDate ?? occurrence.startDate),
      endDate: toIsoString(parsed.endDate ?? occurrence.endDate),
    };

    if (new Date(nextOccurrence.endDate) <= new Date(nextOccurrence.startDate)) {
      throw new DomainError(
        "VALIDATION_ERROR",
        400,
        "A data de fim deve ser posterior à data de início",
      );
    }

    const updatedEvent: IEvent = {
      ...existing,
      occurrences: existing.occurrences.map((item: IOccurrence) =>
        item.id === occurrenceId ? nextOccurrence : item,
      ),
    };

    const saved = await calendarData.replaceEvent(eventId, updatedEvent);
    if (!saved) {
      throw new DomainError("NOT_FOUND", 404, "Evento não encontrado");
    }

    return saved;
  }

  private cloneEventForAcademicYear(event: IEvent, academicYearStart: number): IEvent {
    const delta = academicYearStart - getEventAcademicYearStart({ occurrences: event.occurrences });
    return {
      ...structuredClone(event),
      id: 0,
      occurrences: event.occurrences.map((occurrence) => ({
        id: crypto.randomUUID(),
        description: occurrence.description,
        startDate: shiftDateByYears(occurrence.startDate, delta),
        endDate: shiftDateByYears(occurrence.endDate, delta),
        minDays: occurrence.minDays,
        minDaysToNext: occurrence.minDaysToNext,
      })),
    };
  }

  private buildEventSignature(event: IEvent): string {
    return JSON.stringify({
      name: event.name,
      objective: event.objective,
      academicYearStart: getEventAcademicYearStart({ occurrences: event.occurrences }),
      category: event.category,
      classification: event.classification,
      status: event.status,
      responsible: event.responsible,
      userId: event.user.id,
      occurrences: event.occurrences.map((occurrence) => ({
        description: occurrence.description,
        startDate: occurrence.startDate,
        endDate: occurrence.endDate,
      })),
    });
  }

  private collectEventRuleIssues(event: IEvent, academicYearStart: number, allEvents: IEvent[], vacations: IVacationPeriod[] = []): ICalendarRuleIssue[] {
    const context = { allEvents, academicYearStart, vacations };
    const issues: ICalendarRuleIssue[] = [];

    const sortedOccurrences = [...event.occurrences].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    for (let i = 0; i < sortedOccurrences.length; i++) {
      const occurrence = sortedOccurrences[i];

      for (const builtInRule of [minDurationRule, minDaysToNextRule]) {
        for (const v of builtInRule.validate(event, occurrence, {}, context)) {
          issues.push({
            eventId: event.id,
            eventName: event.name,
            occurrenceId: occurrence.id,
            occurrenceDescription: occurrence.description,
            academicYearStart,
            date: v.date,
            ruleType: builtInRule.id,
            fieldLabelKey: v.fieldLabelKey,
            messageKey: v.messageKey,
            messageParams: v.messageParams,
          });
        }
      }

      for (const rule of event.rules) {
        const violations = validateEventRule(rule, event, occurrence, context);

        for (const v of violations) {
          issues.push({
            eventId: event.id,
            eventName: event.name,
            occurrenceId: occurrence.id,
            occurrenceDescription: occurrence.description,
            academicYearStart,
            date: v.date,
            ruleType: rule.type,
            fieldLabelKey: v.fieldLabelKey,
            messageKey: v.messageKey,
            messageParams: v.messageParams,
          });
        }
      }
    }

    return issues;
  }

  private ensureCanManageEvents(role: IUser["role"]) {
    if (!canManageCalendarEvents(role)) {
      throw new DomainError(
        "FORBIDDEN",
        403,
        "É necessário ter pelo menos o role editor para alterar eventos",
      );
    }
  }
}

export const calendarService = new CalendarService();
