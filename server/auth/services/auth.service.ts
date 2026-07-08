import crypto from "node:crypto";
import type { IUser, IUserWithEmail } from "@/shared/user/types";
import {
  createUserPayloadSchema,
  updateUserPayloadSchema,
} from "@/shared/user/schemas";
import { authData } from "@/server/auth/data/auth.data";
import { hashPassword, normalizeEmail, verifyPassword } from "@/server/auth/crypto";
import { loginPayloadSchema } from "@/server/auth/schemas";
import { DomainError } from "@/server/shared/domain-error";
import { toCalendarUser, toUserWithEmail } from "@/server/auth/types";
import { withRolePolicy, type TRolePolicy } from "@/server/shared/authorize";

const STAY_SIGNED_IN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

// Methods below still take `requestUser` even where the method body no longer
// reads it: withRolePolicy's role extractor reads args[0] positionally for
// every method gated by the policy at the bottom of this file. Unused ones are
// prefixed with `_` and kept in the signature for that reason.
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

  async listUsers(_requestUser: IUser): Promise<IUserWithEmail[]> {
    const users = await authData.listUsers();
    return users.map(toUserWithEmail);
  }

  async createUser(_requestUser: IUser, payload: unknown): Promise<IUserWithEmail> {
    const parsed = createUserPayloadSchema.parse(payload);
    const normalizedEmail = normalizeEmail(parsed.email);

    const existingByEmail = await authData.findUserByEmail(normalizedEmail);
    if (existingByEmail) {
      throw new DomainError("CONFLICT", 409, "Já existe um utilizador com esse email");
    }

    const created = await authData.insertUser({
      id: crypto.randomUUID(),
      name: parsed.name,
      picturePath: parsed.picturePath ?? null,
      role: parsed.role,
      email: normalizedEmail,
      passwordHash: hashPassword(parsed.password),
    });

    return toUserWithEmail(created);
  }

  async updateUser(
    requestUser: IUser,
    userId: string,
    payload: unknown,
  ): Promise<IUserWithEmail> {
    const existing = await authData.findUserById(userId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Utilizador não encontrado");
    }

    const parsed = updateUserPayloadSchema.parse(payload);
    const nextRole = parsed.role ?? existing.role;

    if (requestUser.id === userId && parsed.role && parsed.role !== "admin") {
      throw new DomainError("FORBIDDEN", 403, "Não pode remover o seu próprio role de admin");
    }

    if (existing.role === "admin" && nextRole !== "admin") {
      const adminCount = await authData.countUsersByRole("admin");
      if (adminCount <= 1) {
        throw new DomainError("CONFLICT", 409, "Tem de existir pelo menos um admin no sistema");
      }
    }

    let normalizedEmail: string | undefined;
    if (parsed.email) {
      normalizedEmail = normalizeEmail(parsed.email);
      if (normalizedEmail !== existing.email) {
        const otherUserWithEmail = await authData.findUserByEmail(normalizedEmail);
        if (otherUserWithEmail && otherUserWithEmail.id !== userId) {
          throw new DomainError("CONFLICT", 409, "Já existe um utilizador com esse email");
        }
      }
    }

    const updated = await authData.updateUser(userId, {
      ...(parsed.name ? { name: parsed.name } : {}),
      ...(typeof parsed.picturePath !== "undefined" ? { picturePath: parsed.picturePath } : {}),
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(parsed.role ? { role: parsed.role } : {}),
      ...(parsed.password ? { passwordHash: hashPassword(parsed.password) } : {}),
    });

    if (!updated) {
      throw new DomainError("NOT_FOUND", 404, "Utilizador não encontrado");
    }

    return toUserWithEmail(updated);
  }

  async deleteUser(requestUser: IUser, userId: string): Promise<void> {
    if (requestUser.id === userId) {
      throw new DomainError("FORBIDDEN", 403, "Não pode apagar o seu próprio utilizador");
    }

    const existing = await authData.findUserById(userId);
    if (!existing) {
      throw new DomainError("NOT_FOUND", 404, "Utilizador não encontrado");
    }

    if (existing.role === "admin") {
      const adminCount = await authData.countUsersByRole("admin");
      if (adminCount <= 1) {
        throw new DomainError("CONFLICT", 409, "Tem de existir pelo menos um admin no sistema");
      }
    }

    const deleted = await authData.deleteUser(userId);
    if (!deleted) {
      throw new DomainError("NOT_FOUND", 404, "Utilizador não encontrado");
    }

    await authData.deleteSessionsByUserId(userId);
  }
}

const authServiceInstance = new AuthService();

export const authService = withRolePolicy(
  authServiceInstance,
  {
    login: "any",
    logout: "any",
    getUserBySessionToken: "any",
    listCalendarUsers: "any",
    listUsers: "admin",
    createUser: "admin",
    updateUser: "admin",
    deleteUser: "admin",
  } satisfies Partial<Record<keyof AuthService, TRolePolicy>>,
  (args) => (args[0] as IUser).role,
);


