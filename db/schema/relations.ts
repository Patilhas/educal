import { relations } from "drizzle-orm";
import { users } from "@/db/schema/auth.schema";
import {
  academicYears,
  events,
  eventOccurrences,
  eventRules,
} from "@/db/schema/calendar.schema";

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const academicYearsRelations = relations(academicYears, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  academicYear: one(academicYears, {
    fields: [events.academicYearStart],
    references: [academicYears.startYear],
  }),
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  occurrences: many(eventOccurrences),
  rules: many(eventRules),
}));

export const eventOccurrencesRelations = relations(eventOccurrences, ({ one }) => ({
  event: one(events, {
    fields: [eventOccurrences.eventId],
    references: [events.id],
  }),
}));

export const eventRulesRelations = relations(eventRules, ({ one }) => ({
  event: one(events, {
    fields: [eventRules.eventId],
    references: [events.id],
  }),
}));
