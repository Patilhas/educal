import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "@/db/schema/auth.schema";
import * as calendarSchema from "@/db/schema/calendar.schema";
import * as relations from "@/db/schema/relations";

const schema = { ...authSchema, ...calendarSchema, ...relations };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as { queryClient?: ReturnType<typeof postgres> };

const queryClient = globalForDb.queryClient ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
