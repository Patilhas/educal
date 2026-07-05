import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log("Truncating all tables...");
  await db.execute(sql`
    TRUNCATE TABLE
      sessions, users,
      event_rules, event_occurrences, events,
      vacation_periods, academic_years,
      categories, classifications, statuses, responsibles
    RESTART IDENTITY CASCADE
  `);
  console.log("Truncate complete.");

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
