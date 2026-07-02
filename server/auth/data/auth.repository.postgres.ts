import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema/auth.schema";
import type { IAuthRepository } from "@/server/auth/data/auth.repository";
import type { IUserStored } from "@/shared/user/types";
import type { AuthSessionRecord } from "@/server/auth/types";

function toDomainUser(row: typeof users.$inferSelect): IUserStored {
  return {
    id: row.id,
    name: row.name,
    picturePath: row.picturePath,
    role: row.role,
    email: row.email,
    passwordHash: row.passwordHash,
  };
}

function toDomainSession(row: typeof sessions.$inferSelect): AuthSessionRecord {
  return {
    token: row.token,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export class AuthRepositoryPostgres implements IAuthRepository {
  async listUsers(): Promise<IUserStored[]> {
    const rows = await db.select().from(users);
    return rows.map(toDomainUser);
  }

  async findUserById(userId: string): Promise<IUserStored | null> {
    const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
    return row ? toDomainUser(row) : null;
  }

  async findUserByEmail(email: string): Promise<IUserStored | null> {
    const row = await db.query.users.findFirst({ where: eq(users.email, email) });
    return row ? toDomainUser(row) : null;
  }

  async insertUser(user: IUserStored): Promise<IUserStored> {
    const [row] = await db
      .insert(users)
      .values({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        picturePath: user.picturePath,
        role: user.role,
      })
      .returning();
    return toDomainUser(row);
  }

  async updateUser(userId: string, patch: Partial<IUserStored>): Promise<IUserStored | null> {
    const [row] = await db
      .update(users)
      .set({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.passwordHash !== undefined && { passwordHash: patch.passwordHash }),
        ...(patch.picturePath !== undefined && { picturePath: patch.picturePath }),
        ...(patch.role !== undefined && { role: patch.role }),
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toDomainUser(row) : null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const deleted = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
    return deleted.length > 0;
  }

  async countUsersByRole(role: IUserStored["role"]): Promise<number> {
    const [result] = await db.select({ value: count() }).from(users).where(eq(users.role, role));
    return result.value;
  }

  async upsertSession(session: AuthSessionRecord): Promise<void> {
    await db
      .insert(sessions)
      .values({
        token: session.token,
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
      })
      .onConflictDoUpdate({
        target: sessions.token,
        set: {
          userId: session.userId,
          createdAt: new Date(session.createdAt),
          expiresAt: new Date(session.expiresAt),
        },
      });
  }

  async findSessionByToken(token: string): Promise<AuthSessionRecord | null> {
    const row = await db.query.sessions.findFirst({ where: eq(sessions.token, token) });
    return row ? toDomainSession(row) : null;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
