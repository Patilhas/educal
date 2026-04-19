import crypto from "node:crypto";
import type { IUser } from "@/features/calendar/interfaces";
import { authData } from "@/server/auth/data/auth.data";
import { normalizeEmail, verifyPassword } from "@/server/auth/crypto";
import { loginPayloadSchema } from "@/server/auth/schemas";
import { DomainError } from "@/server/shared/domain-error";
import { toCalendarUser } from "@/server/auth/types";

const STAY_SIGNED_IN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

export class AuthService {
  async login(payload: unknown) {
    const parsed = loginPayloadSchema.parse(payload);
    const normalizedEmail = normalizeEmail(parsed.email);

    const users = await authData.listUsers();
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
      throw new DomainError("UNAUTHORIZED", 401, "Credenciais inválidas");
    }

    const now = Date.now();
    const expiresAt = new Date(
      now + (parsed.staySignedIn ? STAY_SIGNED_IN_TTL_MS : SESSION_TTL_MS),
    );
    const token = crypto.randomBytes(48).toString("base64url");

    await authData.upsertSession({
      token,
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return {
      token,
      user: toCalendarUser(user),
      expiresAt,
      staySignedIn: parsed.staySignedIn,
    };
  }

  async logout(token: string): Promise<void> {
    await authData.deleteSession(token);
  }

  async getUserBySessionToken(token: string): Promise<IUser | null> {
    if (!token) {
      return null;
    }

    const nowIso = new Date().toISOString();

    const session = await authData.findSessionByToken(token);
    if (!session) {
      return null;
    }

    if (session.expiresAt <= nowIso) {
      await authData.deleteSession(token);
      return null;
    }

    const user = await authData.findUserById(session.userId);
    if (!user) {
      return null;
    }

    return toCalendarUser(user);
  }

  async listCalendarUsers(): Promise<IUser[]> {
    const users = await authData.listUsers();
    return users.map(toCalendarUser);
  }

  async findCalendarUserById(userId?: string): Promise<IUser | null> {
    if (!userId) {
      return null;
    }

    const user = await authData.findUserById(userId);
    return user ? toCalendarUser(user) : null;
  }
}

export const authService = new AuthService();


