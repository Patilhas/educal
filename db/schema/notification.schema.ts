import {
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { eventOccurrences } from "@/db/schema/calendar.schema";
import { users } from "@/db/schema/auth.schema";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  occurrenceId: uuid("occurrence_id")
    .notNull()
    .unique()
    .references(() => eventOccurrences.id, { onDelete: "cascade" }),
  occurrenceStartDateAtGen: timestamp("occurrence_start_date_at_gen", { withTimezone: true }).notNull(),
  leadDaysAtGen: integer("lead_days_at_gen"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const notificationReads = pgTable(
  "notification_reads",
  {
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.notificationId, table.userId] })],
);
