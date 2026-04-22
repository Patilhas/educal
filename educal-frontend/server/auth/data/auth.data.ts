import { Redis } from "@upstash/redis";
import { buildAuthSeed } from "@/server/auth/data/auth.seed";
import { AUTH_REDIS_DB_KEY } from "@/server/shared/config";
import type { IUserStored } from "@/shared/user/types";
import type { AuthDb, AuthSessionRecord } from "@/server/auth/types";

const clone = <T>(value: T): T => structuredClone(value);
const CACHE_REVALIDATE_MS = 500;

export class AuthData {
  private writeQueue: Promise<void> = Promise.resolve();
  private cachedDb: AuthDb | null = null;
  private lastCacheValidationAt = 0;
  private redis = Redis.fromEnv();

  private async ensureCacheFile(): Promise<void> {
    const cacheFile = await this.redis.get(AUTH_REDIS_DB_KEY);

    if (!cacheFile) {
      await this.redis.set(AUTH_REDIS_DB_KEY, JSON.stringify(buildAuthSeed()));
    }
  }

  private async readDb(): Promise<AuthDb> {
    await this.ensureCacheFile();

    // If this process is currently writing, wait so reads never see partial state.
    await this.writeQueue;

    const now = Date.now();
    if (
      this.cachedDb &&
      now - this.lastCacheValidationAt < CACHE_REVALIDATE_MS
    ) {
      return this.cachedDb;
    }

    const db = (await this.redis.get(AUTH_REDIS_DB_KEY)) as AuthDb;
    if (!db) {
      throw new Error(`${AUTH_REDIS_DB_KEY} not found in Redis after ensureCacheFile`);
    }

    this.cachedDb = db;
    this.lastCacheValidationAt = now;

    return db;
  }

  private async persistDb(nextDb: AuthDb): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await this.redis.set(AUTH_REDIS_DB_KEY, JSON.stringify(nextDb));

      this.cachedDb = clone(nextDb);
      this.lastCacheValidationAt = Date.now();
    });

    await this.writeQueue;
  }

  async listUsers(): Promise<IUserStored[]> {
    const db = await this.readDb();
    return clone(db.users);
  }

  async findUserById(userId: string): Promise<IUserStored | null> {
    const db = await this.readDb();
    return clone(db.users.find((user) => user.id === userId) ?? null);
  }

  async findUserByEmail(email: string): Promise<IUserStored | null> {
    const db = await this.readDb();
    return clone(db.users.find((user) => user.email === email) ?? null);
  }

  async insertUser(user: IUserStored): Promise<IUserStored> {
    const db = await this.readDb();
    const nextUser = clone(user);

    await this.persistDb({
      ...db,
      users: [...db.users, nextUser],
    });

    return clone(nextUser);
  }

  async updateUser(userId: string, patch: Partial<IUserStored>): Promise<IUserStored | null> {
    const db = await this.readDb();
    let updatedUser: IUserStored | null = null;

    const nextUsers = db.users.map((user) => {
      if (user.id !== userId) {
        return user;
      }

      updatedUser = {
        ...user,
        ...patch,
        id: user.id,
      };

      return updatedUser;
    });

    if (!updatedUser) {
      return null;
    }

    await this.persistDb({
      ...db,
      users: nextUsers,
    });

    return clone(updatedUser);
  }

  async deleteUser(userId: string): Promise<boolean> {
    const db = await this.readDb();
    const nextUsers = db.users.filter((user) => user.id !== userId);

    if (nextUsers.length === db.users.length) {
      return false;
    }

    await this.persistDb({
      ...db,
      users: nextUsers,
    });

    return true;
  }

  async countUsersByRole(role: IUserStored["role"]): Promise<number> {
    const db = await this.readDb();
    return db.users.filter((user) => user.role === role).length;
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

  async deleteSessionsByUserId(userId: string): Promise<void> {
    const db = await this.readDb();

    await this.persistDb({
      ...db,
      sessions: db.sessions.filter((session) => session.userId !== userId),
    });
  }
}

export const authData = new AuthData();


