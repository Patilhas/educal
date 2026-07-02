import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth.schema";

export const academicYears = pgTable("academic_years", {
  startYear: integer("start_year").primaryKey(),
  label: text("label").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
});

export const vacationPeriods = pgTable(
  "vacation_periods",
  {
    id: uuid("id").primaryKey(),
    academicYearStart: integer("academic_year_start")
      .notNull()
      .references(() => academicYears.startYear, { onDelete: "cascade" }),
    label: text("label").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  },
  (table) => [index("vacation_periods_academic_year_idx").on(table.academicYearStart)],
);

export const categories = pgTable("categories", {
  value: text("value").primaryKey(),
  color: text("color").notNull(),
});

export const classifications = pgTable("classifications", {
  value: text("value").primaryKey(),
});

export const statuses = pgTable("statuses", {
  name: text("name").primaryKey(),
});

export const responsibles = pgTable("responsibles", {
  value: text("value").primaryKey(),
});

export const events = pgTable(
  "events",
  {
    id: integer("id").primaryKey(),
    academicYearStart: integer("academic_year_start")
      .notNull()
      .references(() => academicYears.startYear, { onDelete: "cascade" }),
    name: text("name").notNull(),
    objective: text("objective").notNull(),
    category: text("category")
      .notNull()
      .references(() => categories.value),
    classification: text("classification")
      .notNull()
      .references(() => classifications.value),
    status: text("status")
      .notNull()
      .references(() => statuses.name),
    responsible: text("responsible")
      .notNull()
      .references(() => responsibles.value),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => [index("events_academic_year_idx").on(table.academicYearStart)],
);

export const eventOccurrences = pgTable(
  "event_occurrences",
  {
    id: uuid("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    minDays: integer("min_days"),
    minDaysToNext: integer("min_days_to_next"),
  },
  (table) => [
    index("event_occurrences_event_id_idx").on(table.eventId),
    index("event_occurrences_date_range_idx").on(table.startDate, table.endDate),
  ],
);

export const eventRules = pgTable(
  "event_rules",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    config: jsonb("config").notNull().$type<Record<string, unknown>>(),
  },
  (table) => [index("event_rules_event_id_idx").on(table.eventId)],
);
