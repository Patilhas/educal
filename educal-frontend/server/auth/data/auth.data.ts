import { Redis } from "@upstash/redis";
import { buildAuthSeed } from "@/server/auth/data/auth.seed";
import { normalizeEmail } from "@/server/auth/crypto";
import { AUTH_REDIS_DB_KEY } from "@/server/shared/config";
import type { AuthDb, AuthSessionRecord, AuthUserRecord } from "@/server/auth/types";

const clone = <T>(value: T): T => structuredClone(value);

const isValidUserRecord = (user: unknown): user is AuthUserRecord => {
  if (!user || typeof user !== "object") {
    return false;
  }

  const candidate = user as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    (typeof candidate.picturePath === "string" || candidate.picturePath === null) &&
    (candidate.role === "viewer" || candidate.role === "editor" || candidate.role === "admin") &&
    typeof candidate.email === "string" &&
    typeof candidate.passwordHash === "string"
  );
};

const normalizeDb = (db: unknown): AuthDb => {
  if (!db || typeof db !== "object") {
    return buildAuthSeed();
  }

  const candidate = db as Record<string, unknown>;
  if (!Array.isArray(candidate.users) || !Array.isArray(candidate.sessions)) {
    return buildAuthSeed();
  }

  if (!candidate.users.every(isValidUserRecord)) {
    return buildAuthSeed();
  }

  return {
    users: candidate.users.map((user) => ({
      ...user,
      email: normalizeEmail(user.email),
    })),
    sessions: candidate.sessions as AuthSessionRecord[],
  };
};

export class AuthData {
  private writeQueue: Promise<void> = Promise.resolve();
  private redis = Redis.fromEnv();

  private async ensureCacheFile(): Promise<void> {
    const db = await this.redis.get(AUTH_REDIS_DB_KEY);
    if (!db) {
      await this.redis.set(AUTH_REDIS_DB_KEY, JSON.stringify(buildAuthSeed()));
    }
  }

  private async readDb(): Promise<AuthDb> {
    await this.ensureCacheFile();
    await this.writeQueue;

    const rawDb = (await this.redis.get(AUTH_REDIS_DB_KEY)) as unknown;
    const db = normalizeDb(rawDb);
    if (!db) {
      throw new Error(`${AUTH_REDIS_DB_KEY} not found in Redis after initialization`);
    }

    // Rewrite the normalized shape once to remove legacy encrypted email payloads.
    await this.redis.set(AUTH_REDIS_DB_KEY, JSON.stringify(db));

    return db;
  }

  private async persistDb(nextDb: AuthDb): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await this.redis.set(AUTH_REDIS_DB_KEY, JSON.stringify(nextDb));
    });

    await this.writeQueue;
  }

  async listUsers(): Promise<AuthUserRecord[]> {
    const db = await this.readDb();
    return clone(db.users);
  }

  async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const db = await this.readDb();
    return clone(db.users.find((user) => user.id === userId) ?? null);
  }

  async upsertSession(session: AuthSessionRecord): Promise<void> {
    const db = await this.readDb();
    const nextSessions = db.sessions.filter((item) => item.token !== session.token);
    nextSessions.push(session);

    await this.persistDb({
      ...db,
      sessions: nextSessions,
    });
  }

  async findSessionByToken(token: string): Promise<AuthSessionRecord | null> {
    const db = await this.readDb();
    return clone(db.sessions.find((session) => session.token === token) ?? null);
  }

  async deleteSession(token: string): Promise<void> {
    const db = await this.readDb();

    await this.persistDb({
      ...db,
      sessions: db.sessions.filter((session) => session.token !== token),
    });
  }
}

export const authData = new AuthData();


