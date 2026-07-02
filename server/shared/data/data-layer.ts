import { CalendarRepositoryRedis } from "@/server/calendar/data/calendar.repository.redis";
import { CalendarRepositoryPostgres } from "@/server/calendar/data/calendar.repository.postgres";
import type { ICalendarRepository } from "@/server/calendar/data/calendar.repository";
import { AuthRepositoryRedis } from "@/server/auth/data/auth.repository.redis";
import { AuthRepositoryPostgres } from "@/server/auth/data/auth.repository.postgres";
import type { IAuthRepository } from "@/server/auth/data/auth.repository";

type TDataLayer = "postgres" | "redis";

function resolveDataLayer(): TDataLayer {
  return process.env.DATA_LAYER === "redis" ? "redis" : "postgres";
}

export function createCalendarRepository(): ICalendarRepository {
  return resolveDataLayer() === "redis" ? new CalendarRepositoryRedis() : new CalendarRepositoryPostgres();
}

export function createAuthRepository(): IAuthRepository {
  return resolveDataLayer() === "redis" ? new AuthRepositoryRedis() : new AuthRepositoryPostgres();
}
