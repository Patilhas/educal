import { AUTH_REDIS_DB_KEY } from "@/server/shared/config";
import type { IUserStored } from "@/shared/user/types";
import type { AuthDb, AuthSessionRecord } from "@/server/auth/types";
import type { IAuthRepository } from "@/server/auth/data/auth.repository";
import { RedisDbStore, clone } from "@/server/shared/data/redis-store";

export class AuthRepositoryRedis extends RedisDbStore<AuthDb> implements IAuthRepository {
  constructor() {
    super(AUTH_REDIS_DB_KEY, (raw) => {
      if (!raw) {
        throw new Error(
          `${AUTH_REDIS_DB_KEY} not found in Redis. Run \`pnpm run db:seed -- --target=redis\` first.`,
        );
      }
      return raw;
    });
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
    const nextUser = clone(user);
    await this.persistDb((db) => ({ ...db, users: [...db.users, nextUser] }));
    return clone(nextUser);
  }

  async updateUser(userId: string, patch: Partial<IUserStored>): Promise<IUserStored | null> {
    return this.persistDbWithResult((db) => {
      let updatedUser: IUserStored | null = null;
      const nextUsers = db.users.map((user) => {
        if (user.id !== userId) return user;
        updatedUser = { ...user, ...patch, id: user.id };
        return updatedUser;
      });

      if (!updatedUser) return { db, result: null };

      return { db: { ...db, users: nextUsers }, result: clone(updatedUser) };
    });
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.persistDbWithResult((db) => {
      const nextUsers = db.users.filter((user) => user.id !== userId);
      if (nextUsers.length === db.users.length) return { db, result: false };
      return { db: { ...db, users: nextUsers }, result: true };
    });
  }

  async countUsersByRole(role: IUserStored["role"]): Promise<number> {
    const db = await this.readDb();
    return db.users.filter((user) => user.role === role).length;
  }

  async upsertSession(session: AuthSessionRecord): Promise<void> {
    await this.persistDb((db) => {
      const nextSessions = db.sessions.filter((item) => item.token !== session.token);
      nextSessions.push(session);
      return { ...db, sessions: nextSessions };
    });
  }

  async findSessionByToken(token: string): Promise<AuthSessionRecord | null> {
    const db = await this.readDb();
    return clone(db.sessions.find((session) => session.token === token) ?? null);
  }

  async deleteSession(token: string): Promise<void> {
    await this.persistDb((db) => ({
      ...db,
      sessions: db.sessions.filter((session) => session.token !== token),
    }));
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    await this.persistDb((db) => ({
      ...db,
      sessions: db.sessions.filter((session) => session.userId !== userId),
    }));
  }
}
