import type { IUserStored } from "@/shared/user/types";
import type { AuthSessionRecord } from "@/server/auth/types";

export interface IAuthRepository {
  listUsers(): Promise<IUserStored[]>;
  findUserById(userId: string): Promise<IUserStored | null>;
  findUserByEmail(email: string): Promise<IUserStored | null>;
  insertUser(user: IUserStored): Promise<IUserStored>;
  updateUser(userId: string, patch: Partial<IUserStored>): Promise<IUserStored | null>;
  deleteUser(userId: string): Promise<boolean>;
  countUsersByRole(role: IUserStored["role"]): Promise<number>;
  upsertSession(session: AuthSessionRecord): Promise<void>;
  findSessionByToken(token: string): Promise<AuthSessionRecord | null>;
  deleteSession(token: string): Promise<void>;
  deleteSessionsByUserId(userId: string): Promise<void>;
}
