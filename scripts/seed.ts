import { config } from "dotenv";
config({ path: ".env.local" });

async function main(): Promise<void> {
  const { Redis } = await import("@upstash/redis");
  const { db } = await import("@/db/client");
  const {
    categories,
    classifications,
    statuses,
    responsibles,
    academicYears,
    events,
    eventOccurrences,
    eventRules,
    vacationPeriods,
  } = await import("@/db/schema/calendar.schema");
  const { users } = await import("@/db/schema/auth.schema");
  const { buildCalendarSeed } = await import("@/server/calendar/data/calendar.seed");
  const { buildAuthSeed } = await import("@/server/auth/data/auth.seed");
  const { CALENDAR_REDIS_DB_KEY, AUTH_REDIS_DB_KEY } = await import(
    "@/server/shared/config"
  );

  function parseTarget(): "postgres" | "redis" {
    const arg = process.argv.find((a) => a.startsWith("--target="));
    const value = arg?.split("=")[1];
    if (value !== "postgres" && value !== "redis") {
      throw new Error("Usage: pnpm run db:seed -- --target=postgres|redis");
    }
    return value;
  }

  async function seedRedis(): Promise<void> {
    const redis = Redis.fromEnv();
    await redis.set(CALENDAR_REDIS_DB_KEY, JSON.stringify(buildCalendarSeed()));
    await redis.set(AUTH_REDIS_DB_KEY, JSON.stringify(buildAuthSeed()));
    console.log("Seeded Redis (calendar-db, auth-db).");
  }

  async function seedPostgres(): Promise<void> {
    const calendarSeed = buildCalendarSeed();
    const authSeed = buildAuthSeed();
    const academicYear = calendarSeed.academicYears[0];

    await db.transaction(async (tx) => {
      await tx.insert(users).values(authSeed.users);

      await tx.insert(categories).values(calendarSeed.categories);
      await tx.insert(classifications).values(calendarSeed.classifications);
      await tx.insert(statuses).values(calendarSeed.statuses);
      await tx.insert(responsibles).values(calendarSeed.responsibles);

      await tx.insert(academicYears).values({
        startYear: academicYear.startYear,
        label: academicYear.label,
        startDate: new Date(academicYear.startDate),
        endDate: new Date(academicYear.endDate),
      });

      for (const event of academicYear.events) {
        await tx.insert(events).values({
          id: event.id,
          academicYearStart: academicYear.startYear,
          name: event.name,
          objective: event.objective,
          category: event.category,
          classification: event.classification,
          status: event.status,
          responsible: event.responsible,
          userId: event.user.id,
        });

        if (event.occurrences.length > 0) {
          await tx.insert(eventOccurrences).values(
            event.occurrences.map((o) => ({
              id: o.id,
              eventId: event.id,
              description: o.description,
              startDate: new Date(o.startDate),
              endDate: new Date(o.endDate),
              minDays: o.minDays ?? null,
              minDaysToNext: o.minDaysToNext ?? null,
            })),
          );
        }

        if (event.rules.length > 0) {
          await tx.insert(eventRules).values(
            event.rules.map((r) => ({ eventId: event.id, type: r.type, config: r.config })),
          );
        }
      }

      for (const vacation of academicYear.vacations) {
        await tx.insert(vacationPeriods).values({
          id: vacation.id,
          academicYearStart: academicYear.startYear,
          label: vacation.label,
          startDate: new Date(vacation.startDate),
          endDate: new Date(vacation.endDate),
        });
      }
    });

    console.log(
      `Seeded Postgres: ${authSeed.users.length} users, ${academicYear.events.length} events.`
    );
  }

  const target = parseTarget();
  if (target === "redis") {
    await seedRedis();
  } else {
    await seedPostgres();
  }
  console.log(`Seed complete for target "${target}".`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
