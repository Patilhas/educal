import type { IUser } from "@/features/calendar/interfaces";

export type UserRole = "viewer" | "editor" | "admin";

export interface AuthUserRecord {
  id: string;
  name: string;
  picturePath: string | null;
  role: UserRole;
  email: string;
  passwordHash: string;
}

export interface AuthSessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthDb {
  users: AuthUserRecord[];
  sessions: AuthSessionRecord[];
}

export const toCalendarUser = (user: AuthUserRecord): IUser => ({
  id: user.id,
  name: user.name,
  picturePath: user.picturePath,
  role: user.role,
});


